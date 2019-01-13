import * as vscode from 'vscode';
import * as fs from 'fs';
import { Template } from '../mode/template';
import { TemplateData } from '../service/TemplateData';
import { GenaretorCode } from '../GenaretorCode';

export class Utils {

    templateData: TemplateData;

    workspaceRoot: string;

    fse = require('fs-extra');

    ejs = require('ejs');

    output: vscode.OutputChannel;

    constructor() {
        this.workspaceRoot = vscode.workspace.rootPath + '';
        this.checkProjectFile();
        this.templateData = new TemplateData();
        this.output = vscode.window.createOutputChannel('代码生成工具');
    }

    checkProjectFile() {
        if (!fs.existsSync(this.workspaceRoot + '/data.json')) {
            fs.writeFileSync(this.workspaceRoot + '/data.json', '{}', 'utf8');
        }
        if (!fs.existsSync(this.workspaceRoot + '/.genaretor')) {
            fs.mkdirSync(this.workspaceRoot + '/.genaretor');
        }
        if (!fs.existsSync(this.workspaceRoot + '/.genaretor/template')) {
            fs.mkdirSync(this.workspaceRoot + '/.genaretor/template');
        }
    }

    getUUID() {
        let d = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
        return uuid;
    }

    createTemplate(file: string, type: string, update?: boolean) {
        const f = vscode.workspace.rootPath + '/.genaretor/template/' + file;
        if (type === 'template') {
            fs.writeFileSync(f, '', 'utf8');
            if (update === undefined) {
                fs.writeFileSync(f + '.ejs', '', 'utf8');
            } else {
                fs.writeFileSync(f.substring(0, f.length - 3), '', 'utf8');
            }
        } else {
            fs.mkdirSync(f);
        }
    }

    removeTemplate(file: string, type: string) {
        const f = vscode.workspace.rootPath + '/.genaretor/template/' + file;
        if (type === 'template') {
            this.fse.removeSync(f);
            try {
                this.fse.removeSync(f + '.ejs');
                this.fse.removeSync(f.substring(0, f.length - 3));
            } catch (e) { }
        } else {
            this.fse.removeSync(f);
        }
    }

    renameTemplate(oldFile: string, newFile: string, update?: boolean): void {
        const oldf = vscode.workspace.rootPath + '/.genaretor/template/' + oldFile;
        const newf = vscode.workspace.rootPath + '/.genaretor/template/' + newFile;
        if (update === undefined) {
            this.fse.moveSync(oldf, newf, { overwite: true });
            this.fse.moveSync(oldf + '.ejs', newf + '.ejs', { overwite: true });
        } else {
            this.fse.moveSync(oldf, newf, { overwite: true });
            this.fse.moveSync(oldf.substring(0, oldf.length - 3), newf.substring(0, newf.length - 3), { overwite: true });
        }
    }

    createFolder(tree: GenaretorCode, node?: Template) {
        const n = new Template('', 'folder', '', vscode.TreeItemCollapsibleState.Collapsed);
        if (node !== undefined) {
            n.parentId = node.id;
        }
        vscode.window.showInputBox({
            value: '',
            placeHolder: '输入文件夹名称'
        }).then(result => {
            if (result === undefined) {
                return;
            }
            if ((result + '').trim().length === 0) {
                vscode.window.showErrorMessage('请输入名称!');
            } else {
                n.label = result + '';
                let flag = false;
                if (node !== undefined) {
                    n.parentFolder = node.parentFolder + '/' + n.label;
                    this.templateData.getTemplate(node.id).some((t: Template) => {
                        if (n.label.trim() === t.label.trim()) {
                            flag = true;
                            return flag;
                        }
                    });
                } else {
                    n.parentFolder = n.label;
                    this.templateData.getRootTemplate().some((t: Template) => {
                        if (n.label.trim() === t.label.trim()) {
                            flag = true;
                            return flag;
                        }
                    });
                }
                if (flag) {
                    vscode.window.showErrorMessage('已存在该模板!');
                    return;
                }
                this.createTemplate(n.parentFolder, n.type);
                n.id = this.getUUID();
                this.templateData.setTemplate(n);
                tree.refresh(node);
            }
        });
    }

    getItem(node?: Template) {
        if (node === undefined) {
            return this.templateData.getRootTemplate();
        } else {
            return this.templateData.getTemplate(node.id);
        }
    }

    createFile(tree: GenaretorCode, node?: Template, update?: boolean) {
        const n = new Template('', 'template', '', vscode.TreeItemCollapsibleState.None);
        if (node !== undefined) {
            n.parentId = node.id;
        }
        if (update) {
            n.flag = 'update';
        }
        vscode.window.showInputBox({
            value: '',
            placeHolder: '输入模板名称,如: User.java'
        }).then(result => {
            if (result === undefined) {
                return;
            }
            if ((result + '').trim().length === 0) {
                vscode.window.showErrorMessage('请输入名称!');
            } else {
                if (update) {
                    result = result + '.js';
                }
                n.label = result + '';
                let flag = false;
                if (node !== undefined) {
                    n.parentFolder = node.parentFolder + '/' + n.label;
                    this.templateData.getTemplate(node.id).some((t: Template) => {
                        if (n.label.trim() === t.label.trim()) {
                            flag = true;
                            return flag;
                        }
                    });
                    const files = fs.readdirSync(vscode.workspace.rootPath + '/.genaretor/template/' + node.parentFolder);
                    files.forEach(f => {
                        if (f === n.label.trim() || f === n.label.trim() + '.js' || f === n.label.trim() + '.ejs') {
                            flag = true;
                        }
                    });
                } else {
                    n.parentFolder = n.label;
                    this.templateData.getRootTemplate().some((t: Template) => {
                        if (n.label.trim() === t.label.trim()) {
                            flag = true;
                            return flag;
                        }
                    });
                }
                if (flag) {
                    vscode.window.showErrorMessage('该模板或预览文件已存在!');
                    return;
                }
                this.createTemplate(n.parentFolder, n.type, update);
                n.id = this.getUUID();
                this.templateData.setTemplate(n);
                tree.refresh(node);
            }
        });
    }

    rename(tree: GenaretorCode, node: Template) {
        let label = node.label;
        if (node.flag === 'update') {
            label = label.substring(0, label.length - 3);
        }
        vscode.window.showInputBox({
            prompt: 'Label:',
            value: label,
            placeHolder: '输入文件夹名称'
        }).then(result => {
            if (result === undefined) {
                return;
            }
            if ((result + '').trim().length === 0) {
                vscode.window.showErrorMessage('请输入名称!');
            } else {
                let update;
                if (node.flag === 'update') {
                    result = result + '.js';
                    update = true;
                }
                const oldLabel = node.label + '';
                node.label = result + '';
                const oldParent = node.parentFolder + '';
                const a = node.parentFolder.split('/');
                a.splice(- 1, 1);
                node.parentFolder = a.join('/') + '/' + node.label;
                this.templateData.updateTemplate(node, oldLabel);
                try {
                    this.renameTemplate(oldParent, node.parentFolder, update);
                } catch (e) { }
                tree.refresh(node);
            }
        });
    }

    remove(tree: GenaretorCode, node: Template) {
        vscode.window.showInputBox({
            prompt: `是否删除[${node.label}]?`,
            value: '是'
        }).then(result => {
            if (result === undefined) {
                return;
            }
            if ((result + '').trim().length === 0) {
                vscode.window.showErrorMessage('请输入[是]!');
            } else {
                const folder = node.parentFolder + '', t = node.type + '';
                this.removeTemplate(folder, t);
                this.templateData.removeById(node.id);
                tree.refresh();
            }
        });
    }

    openDocument(id: string) {
        const { parentFolder, flag } = this.templateData.getTemplateById(id);
        let file = parentFolder;
        if (flag === 'add') {
            file = parentFolder + '.ejs';
        }
        const openPath = vscode.Uri.parse('file:///' + vscode.workspace.rootPath + '/.genaretor/template/' + file);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            const p: any = JSON.parse(JSON.stringify(doc));
            p.fileName = file;
            p.uri.path = '模板/' + file;
            p.uri.fsPath = 'genaretorCode-' + id;
            vscode.window.showTextDocument(p);
        });
    }

    getAllData() {
        const root = vscode.workspace.rootPath + '';
        const data = JSON.parse(fs.readFileSync(root + '/data.json', 'utf8'));
        return data;
    }

    complieTemplate(id: string) {
        const root = vscode.workspace.rootPath + '';
        const node = this.templateData.getTemplateById(id), data = this.getAllData();
        if (node.flag === 'add') {
            try {
                const c = fs.readFileSync(root + '/.genaretor/template/' + node.parentFolder + '.ejs', 'utf8');
                const content = this.ejs.render(c, data);
                fs.writeFileSync(root + '/.genaretor/template/' + node.parentFolder, content, 'utf8');
                this.openDoc(id);
            } catch (e) {
                vscode.window.showErrorMessage('模板错误:' + e.toString());
            }
        } else {
            try {
                const file = this.renderName(data, this.templateData.getUpdateFile(node));
                if (!fs.existsSync(file)) {
                    vscode.window.showErrorMessage(`文件[${file}]不存在, 无法修改!`);
                    return false;
                }
                const content = eval(`function init() {const content = \`${fs.readFileSync(file, 'utf8').replace(/\$/g, '\\\$').replace(/\`/g, '\\\`')}\`;` + fs.readFileSync(root + '/.genaretor/template/' + node.parentFolder, 'utf8') + '}init();');
                if (content === undefined) {
                    vscode.window.showWarningMessage('请使用[return]定义输出内容!');
                } else {
                    let file = node.parentFolder;
                    fs.writeFileSync(root + '/.genaretor/template/' + file.substring(0, file.length - 3), content, 'utf8');
                    this.openDoc(id);
                }
            } catch (e) {
                vscode.window.showErrorMessage('模板错误:' + e.toString());
            }
        }
    }

    openDoc(id: string) {
        const { parentFolder, flag } = this.templateData.getTemplateById(id);
        let file = parentFolder;
        if (flag === 'update') {
            file = parentFolder.substring(0, parentFolder.length - 3);
        }
        const openPath = vscode.Uri.parse('file:///' + vscode.workspace.rootPath + '/.genaretor/template/' + file);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            const p: any = JSON.parse(JSON.stringify(doc));
            p.fileName = file;
            p.uri.path = this.renderName(this.getAllData(), '预览/' + file);
            vscode.window.showTextDocument(p);
        });
    }

    renderName(data: any, template: string): string {
        const replaceKey = [];
        const str: Array<any> = [];
        for (const key in data) {
            replaceKey.push(key);
            str.push(data[key]);
        }
        for (let i = 0; i < replaceKey.length; i++) {
            const reg = new RegExp("{" + replaceKey[i] + "}", "g");
            template = template.replace(reg, str[i]);
        }
        return template;
    }

    selectProject(d: Template, tree: GenaretorCode) {
        vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false
        }).then(folders => {
            if (folders && folders !== null && folders.length > 0) {
                const folder = folders[0].fsPath;
                d.path = folder;
                d.tooltip = folder;
                this.templateData.updateTemplatePath(d);
                vscode.window.showInformationMessage('生成路径:' + folder);
                tree.refresh(d);
            }
        });
    }

    genaretorFile() {
        let flag = true, d: Array<any> = [];
        const templates = this.templateData.getAllTemplate(), data = this.getAllData();
        templates.some((t: any) => {
            const file = this.renderName(data, t.file);
            const result = this.compileTemplate(t, data, file);
            if (result === false) {
                flag = false;
                return true;
            } else {
                d.push({ file: file, content: result, flag: t.type });
                return false;
            }
        });
        if (flag) {
            this.output.show();
            d.forEach((f, i) => {
                if (f.flag === 'add' && fs.existsSync(f.file)) {
                    this.output.appendLine(`${this.getNowTime()} 文件[${f.file}](添加)已经存在, 无需生成!`);
                } else {
                    this.fse.outputFileSync(f.file, f.content, 'utf8');
                    this.output.appendLine(`${this.getNowTime()} 文件[${f.file}]生成成功!`);
                }
                if (i === d.length - 1) {
                    this.output.appendLine(`${this.getNowTime()} 执行完成!`);
                }
            });
        }
    }

    compileTemplate(node: any, data: any, file: string): any {
        const root = vscode.workspace.rootPath + '';
        if (node.type === 'add') {
            try {
                const c = fs.readFileSync(root + '/.genaretor/template/' + node.template, 'utf8');
                const content = this.ejs.render(c, data);
                fs.writeFileSync(root + '/.genaretor/template/' + node.render, content, 'utf8');
                return content;
            } catch (e) {
                vscode.window.showErrorMessage('模板错误:' + e.toString());
                return false;
            }
        } else {
            if (!fs.existsSync(file)) {
                vscode.window.showErrorMessage(`文件[${file}]不存在, 无法修改!`);
                return false;
            }
            try {
                const content = eval(`function init() {const content = \`${fs.readFileSync(file, 'utf8').replace(/\$/g, '\\\$').replace(/\`/g, '\\\`')}\`;` + fs.readFileSync(root + '/.genaretor/template/' + node.template, 'utf8') + '}init();');
                if (content === undefined) {
                    vscode.window.showWarningMessage('请使用[return]定义输出内容!');
                    return false;
                } else {
                    fs.writeFileSync(root + '/.genaretor/template/' + node.render, content, 'utf8');
                    return content;
                }
            } catch (e) {
                vscode.window.showErrorMessage('模板错误:' + e.toString());
                return false;
            }
        }
    }

    getNowTime() {
        let date = new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hours = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();

        let code = date.getFullYear() + '-' + toForMatter(month) + '-' +
            toForMatter(day) + ' ' + toForMatter(hours) + ':' + toForMatter(min)
            + ':' + toForMatter(sec);

        function toForMatter(num: any) {
            if (num < 10) {
                num = "0" + num;
            }
            return num + "";
        }
        return code;
    }
}