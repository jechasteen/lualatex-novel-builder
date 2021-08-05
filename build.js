const fs = require("fs")
const path = require("path")
const exec = require("child_process").exec
const fields = require("./fields")
const y = require("yaml")

const buildHeader = (config) => {
    let header = fields.documentclass

    for (let i = 0; i < fields.headerFields.length; i++) {
        let currentTable = fields[fields.headerFields[i]]
        for (let key in currentTable) {
            header += currentTable[key](config[fields.headerFields[i]][key]) + "\n"
        }
    }

    return header
}

const buildContent = (content) => {
    let res = ""
    for (let key in content) {
        res += content[key] + '\n'
    }
    return res
}

// Build
; (() => {
    const config = y.parse(fs.readFileSync(path.join(__dirname, "defaults.yml"), { encoding: "utf-8" }))
    const chapters = fs.readdirSync(path.join(__dirname, "chapters"))
    const content = {}
    let document = ""
    for (let i = 0; i < chapters.length; i++) {
        let currentChapter = fs.readFileSync(
            path.join(__dirname, "chapters", chapters[i]),
            { encoding: "utf-8" },
        )
        currentChapter = currentChapter.split('\n')
        for (let line = 0; line < currentChapter.length; line++) {
            let title
            // TODO Support \ChapterDeco
            if (currentChapter[line].match(/^# .+/g)) {
                title = currentChapter[line].replace("# ", "")
                currentChapter.splice(line, line + 1)
                content[chapters[i]] = fields.chapter(title, config.chapterStyle.recto, currentChapter.join("\n"))
            }
        }
    }

    document += buildHeader(config) + "\n"
    document += fields.document.wrapper(buildContent(content))
    if (!fs.existsSync(path.join(__dirname, config.build))) {
        fs.mkdirSync(path.join(__dirname, config.build), { recursive: true })
    }
    fs.writeFileSync(path.join(__dirname, config.build, config.tex_filename), document)

    exec(`lualatex --output-directory=${path.join(__dirname, config.build)} ${path.join(__dirname, config.build, config.tex_filename)}`, (err, stdout, stderr) => {
        if (err) throw err
        if (stdout) console.log(stdout)
        if (stderr) console.log(stderr)
    })
})()