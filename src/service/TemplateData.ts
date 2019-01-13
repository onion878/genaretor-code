import * as vscode from 'vscode';
import { Template } from '../mode/template';

export class TemplateData {

    low = require('lowdb');

    FileSync = require('lowdb/adapters/FileSync');

    con: any;

    constructor() {
        const adapter = new this.FileSync(vscode.workspace.rootPath + '/.genaretor/template.json');
        this.con = this.low(adapter);
        this.con.defaults({ template: [] }).write();
    }

    public setTemplate(data: Template) {
        if (data.parentId === 'root') {
            data.contextValue = data.parentId;
        } else {
            data.contextValue = data.type;
        }
        this.con.get('template').push(data).write();
    }

    public updateTemplate(data: Template, old: string) {
        this.con.get('template').find({ id: data.id }).set('label', data.label).set('parentFolder', data.parentFolder).write();
        const child = this.con.get('template').filter({ parentId: data.id }).value();
        child.map((t: Template) => {
            this.updateParentFolder(t, data.label, old);
        });
    }

    public updateTemplatePath(data: Template) {
        this.con.get('template').find({ id: data.id }).set('path', data.path).write();
    }

    public updateTemplateFile(data: Template) {
        this.con.get('template').find({ id: data.id }).set('file', data.file).write();
    }

    public updateParentFolder(data: Template, folder: string, old: string) {
        let d: string = data.parentFolder;
        d = d.replace(old, folder);
        this.con.get('template').find({ id: data.id }).set('parentFolder', d).write();
        const child = this.con.get('template').filter({ parentId: data.id }).value();
        child.map((t: Template) => {
            this.updateParentFolder(t, folder, old);
        });
    }

    public removeById(id: string) {
        this.con.get('template').remove({ id: id }).write();
        const child = this.con.get('template').filter({ parentId: id }).value();
        child.forEach((c: any) => {
            this.removeById(c.id);
        });
    }

    public getTemplateById(id: string) {
        return this.con.get('template').find({ id: id }).value();
    }

    public getTemplate(parentId: string) {
        return this.con.get('template').filter({ parentId: parentId }).value();
    }

    public getRootTemplate() {
        return this.con.get('template').filter({ parentId: 'root' }).value();
    }

    public getAllTemplate() {
        const root = this.con.get('template').filter({ parentId: 'root' }).value(), data: Array<any> = [];
        root.forEach((r: any) => {
            this.getChild(r, r.path, data);
        });
        return data;
    }

    public getChild(parent: any, rootFolder: string, data: Array<any>) {
        if (parent.contextValue === 'template') {
            let render = parent.parentFolder, template = parent.parentFolder;
            if (parent.flag === 'add') {
                template = parent.parentFolder + '.ejs';
            } else {
                render = render.substring(0, render.length - 3);
            }
            data.push({
                id: parent.id,
                file: rootFolder + '/' + render,
                type: parent.flag,
                template: template,
                render: render
            });
        }
        const child = this.con.get('template').filter({ parentId: parent.id }).value();
        child.forEach((r: any) => {
            this.getChild(r, rootFolder, data);
        });
    }

    public getUpdateFile(node: any): string {
        const file = node.parentFolder;
        return this.getRootById(node.parentId) + '/' + file.substring(0, file.length - 3);
    }

    public getRootById(id: string): string {
        const node = this.con.get('template').find({ id: id }).value();
        if (node.parentId === 'root') {
            return node.path;
        } else {
            return this.getRootById(node.parentId);
        }
    }
}