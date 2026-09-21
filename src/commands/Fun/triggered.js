const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage } = require("@napi-rs/canvas")
const { handlemsg } = require("../../utils/stringUtils")

class GifEncoder {
    constructor(width, height) {
        this.width = width
        this.height = height
        this.frames = []
        this.delay = 50
    }

    setDelay(delay) {
        this.delay = delay
    }

    addFrame(ctx) {
        const imgData = ctx.getImageData(0, 0, this.width, this.height)
        this.frames.push(imgData.data)
    }

    encode() {
        const bufferList = []

        bufferList.push(Buffer.from("GIF89a"))
        const lsd = Buffer.alloc(7)
        lsd.writeUInt16LE(this.width, 0)
        lsd.writeUInt16LE(this.height, 2)
        lsd[4] = 0x70
        lsd[5] = 0
        lsd[6] = 0
        bufferList.push(lsd)

        const loop = Buffer.from([
            0x21, 0xFF, 0x0B,
            0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30,
            0x03, 0x01, 0x00, 0x00, 0x00
        ])
        bufferList.push(loop)

        for (const frameData of this.frames) {
            const { indexedPixels, palette } = this._quantize(frameData)

            const delayCentiseconds = Math.round(this.delay / 10)
            const gce = Buffer.alloc(8)
            gce[0] = 0x21
            gce[1] = 0xF9
            gce[2] = 0x04
            gce[3] = 0x08
            gce.writeUInt16LE(delayCentiseconds, 4)
            gce[6] = 0
            gce[7] = 0x00
            bufferList.push(gce)

            const id = Buffer.alloc(10)
            id[0] = 0x2C
            id.writeUInt16LE(0, 1)
            id.writeUInt16LE(0, 3)
            id.writeUInt16LE(this.width, 5)
            id.writeUInt16LE(this.height, 7)
            id[9] = 0x87
            bufferList.push(id)

            const lct = Buffer.alloc(256 * 3)
            for (let i = 0; i < 256; i++) {
                if (i < palette.length) {
                    lct[i * 3] = palette[i][0]
                    lct[i * 3 + 1] = palette[i][1]
                    lct[i * 3 + 2] = palette[i][2]
                }
            }
            bufferList.push(lct)

            const lzwData = this._lzwEncode(indexedPixels, 8)
            bufferList.push(lzwData)
        }

        bufferList.push(Buffer.from([0x3B]))

        return Buffer.concat(bufferList)
    }

    _quantize(rgba) {
        const palette = []
        const indexedPixels = new Uint8Array(this.width * this.height)

        for (let i = 0; i < 256; i++) {
            const r = (i >> 5) * 36
            const g = ((i >> 2) & 0x07) * 36
            const b = (i & 0x03) * 85
            palette.push([r, g, b])
        }

        let pixelIdx = 0
        for (let i = 0; i < rgba.length; i += 4) {
            const r = rgba[i]
            const g = rgba[i + 1]
            const b = rgba[i + 2]

            const idx = ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6)
            indexedPixels[pixelIdx++] = idx
        }

        return { indexedPixels, palette }
    }

    _lzwEncode(pixels, minCodeSize) {
        const clearCode = 1 << minCodeSize
        const eoiCode = clearCode + 1
        let codeSize = minCodeSize + 1
        let nextCode = eoiCode + 1

        const dictionary = new Map()
        const initDict = () => {
            dictionary.clear()
            for (let i = 0; i < clearCode; i++) {
                dictionary.set(String.fromCharCode(i), i)
            }
            codeSize = minCodeSize + 1
            nextCode = eoiCode + 1
        }

        initDict()

        const outputBits = []
        let bitBuffer = 0
        let bitCount = 0

        const writeBits = (code, length) => {
            bitBuffer |= (code << bitCount)
            bitCount += length
            while (bitCount >= 8) {
                outputBits.push(bitBuffer & 0xFF)
                bitBuffer >>= 8
                bitCount -= 8
            }
        }

        writeBits(clearCode, codeSize)

        let prefix = ""
        for (let i = 0; i < pixels.length; i++) {
            const char = String.fromCharCode(pixels[i])
            const combined = prefix + char
            if (dictionary.has(combined)) {
                prefix = combined
            } else {
                writeBits(dictionary.get(prefix), codeSize)
                if (nextCode < 4096) {
                    dictionary.set(combined, nextCode++)
                    if (nextCode > (1 << codeSize) && codeSize < 12) {
                        codeSize++
                    }
                } else {
                    writeBits(clearCode, codeSize)
                    initDict()
                }
                prefix = char
            }
        }

        if (prefix !== "") {
            writeBits(dictionary.get(prefix), codeSize)
        }

        writeBits(eoiCode, codeSize)
        if (bitCount > 0) {
            outputBits.push(bitBuffer & 0xFF)
        }

        const blocks = [Buffer.from([minCodeSize])]
        let pos = 0
        while (pos < outputBits.length) {
            const len = Math.min(255, outputBits.length - pos)
            const subBlock = Buffer.alloc(len + 1)
            subBlock[0] = len
            for (let i = 0; i < len; i++) {
                subBlock[i + 1] = outputBits[pos + i]
            }
            blocks.push(subBlock)
            pos += len
        }
        blocks.push(Buffer.from([0x00]))

        return Buffer.concat(blocks)
    }
}

module.exports = {
    guildOnly: false,
    cooldown: 8,
    data: new SlashCommandBuilder()
        .setName("triggered")
        .setDescription("Generate an animated triggered meme GIF from a user")
        .addUserOption(opt => opt
            .setName("user")
            .setDescription("The user to trigger")
            .setRequired(false)),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        await interaction.deferReply().catch(err => console.error("[triggered] Failed to defer reply:", err.message))

        const targetUser = interaction.options.getUser("user") || interaction.user

        try {
            const avatarUrl = targetUser.displayAvatarURL({ extension: "png", size: 256, forceStatic: true })
            const avatarImg = await loadImage(avatarUrl)

            const size = 280
            const bannerHeight = 50
            const totalHeight = size + bannerHeight

            const encoder = new GifEncoder(size, totalHeight)
            encoder.setDelay(40)

            const frameCount = 8
            const shakeOffsets = [
                { x: -12, y: -10 },
                { x: 14, y: 8 },
                { x: -8, y: 12 },
                { x: 10, y: -14 },
                { x: -15, y: 6 },
                { x: 12, y: -8 },
                { x: -6, y: -12 },
                { x: 8, y: 10 }
            ]

            for (let f = 0; f < frameCount; f++) {
                const canvas = createCanvas(size, totalHeight)
                const ctx = canvas.getContext("2d")

                const offset = shakeOffsets[f] || { x: 0, y: 0 }

                const zoom = 1.15
                const drawW = size * zoom
                const drawH = size * zoom
                const drawX = (size - drawW) / 2 + offset.x
                const drawY = (size - drawH) / 2 + offset.y

                ctx.drawImage(avatarImg, drawX, drawY, drawW, drawH)

                ctx.fillStyle = "rgba(255, 0, 0, 0.38)"
                ctx.fillRect(0, 0, size, size)

                const bannerOffset = {
                    x: (Math.random() - 0.5) * 6,
                    y: (Math.random() - 0.5) * 4
                }

                ctx.fillStyle = "#E74C3C"
                ctx.fillRect(0, size, size, bannerHeight)

                ctx.fillStyle = "#C0392B"
                ctx.fillRect(0, size + bannerHeight - 4, size, 4)

                ctx.fillStyle = "#FFFFFF"
                ctx.font = "italic 900 30px sans-serif"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"

                ctx.fillStyle = "#000000"
                ctx.fillText("TRIGGERED", size / 2 + bannerOffset.x + 2, size + bannerHeight / 2 + bannerOffset.y + 2)

                ctx.fillStyle = "#FFFFFF"
                ctx.fillText("TRIGGERED", size / 2 + bannerOffset.x, size + bannerHeight / 2 + bannerOffset.y)

                encoder.addFrame(ctx)
            }

            const gifBuffer = encoder.encode()
            const attachment = new AttachmentBuilder(gifBuffer, { name: "triggered.gif" })

            const descText = handlemsg(ls["cmds"]["triggered"]["desc"], { user: targetUser.id })

            client.Embed([{
                title: ls["cmds"]["triggered"]["title"],
                desc: descText,
                image: "attachment://triggered.gif",
                timestamp: interaction.createdTimestamp
            }], undefined, "editReply", false, interaction, [attachment])

        } catch (err) {
            console.error("[triggered] Error generating triggered GIF:", err.message)
            client.errEmbed({
                type: "editReply",
                desc: ls["cmds"]["triggered"]["err"]
            }, interaction)
        }
    }
}
