import * as vscode from 'vscode';
import { Template } from './mode/template';
import { Utils } from './utils/utils';

export class GenaretorCode implements vscode.TreeDataProvider<Template>{

    private _onDidChangeTreeData: vscode.EventEmitter<Template | undefined> = new vscode.EventEmitter<Template | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Template | undefined> = this._onDidChangeTreeData.event;

    constructor(private utils: Utils) {
    }

    refresh(offset?: Template): void {
        if (offset) {
            this._onDidChangeTreeData.fire(offset);
        } else {
            this._onDidChangeTreeData.fire();
        }
    }

    getTreeItem(element: Template): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Template): Thenable<Template[]> {
        const data: Template[] = this.utils.getItem(element);
        data.map((d: Template) => {
            if (d.parentId === "root") {
                d.tooltip = d.path;
            }
            if (d.type === 'template') {
                d.command = {
                    command: 'extension.openDocument',
                    title: '',
                    arguments: [d.id]
                };
                d.description = d.flag;
            }
        });
        return Promise.resolve(data);
    }
}