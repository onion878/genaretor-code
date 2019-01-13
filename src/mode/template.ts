import * as vscode from 'vscode';

export class Template extends vscode.TreeItem {

    public parentId: string = "root";

    public parentFolder: string = "";

    public contextValue: string = this.type;

    public id: string = "";

    public flag: string = "add";

    public path: string = "";

    public file: string = "";

    constructor(
        public label: string,
        public type: string,
        public remark: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }

    get tooltip(): string {
        return `${this.label}-${this.flag}`;
    }

    set tooltip(v: string) {}

    set description(v: string) {}

    get description(): string {
        if (this.type === 'template') {
            return this.flag;
        } else {
            return "";
        }
    }
}