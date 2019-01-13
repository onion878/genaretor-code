import * as vscode from 'vscode';
import { GenaretorCode } from './GenaretorCode';
import { Utils } from './utils/utils';

export function activate(context: vscode.ExtensionContext) {

	if (vscode.workspace.rootPath === undefined) {
		vscode.window.showInformationMessage('请打开模板项目');
		return;
	}

	const utils = new Utils();

	const mainProvider = new GenaretorCode(utils);
	vscode.commands.registerCommand('extension.newProject', d => utils.createFolder(mainProvider, d));

	vscode.commands.registerCommand('extension.newFolder', d => utils.createFolder(mainProvider, d));

	vscode.commands.registerCommand('extension.newTemplate', d => utils.createFile(mainProvider, d));

	vscode.commands.registerCommand('extension.newUpdateTemplate', d => utils.createFile(mainProvider, d, true));

	vscode.commands.registerCommand('extension.rename', d => utils.rename(mainProvider, d));

	vscode.commands.registerCommand('extension.remove', d => utils.remove(mainProvider, d));

	vscode.commands.registerCommand('extension.openDocument', d => utils.openDocument(d));

	vscode.commands.registerCommand('extension.review', d => {
		let id = '';
		if (d.fsPath.substring(0, 13) === 'genaretorCode') {
			id = d.fsPath.replace('genaretorCode-', '');
		}
		if (id.length > 0) {
			utils.complieTemplate(id);
		} else {
			vscode.window.showErrorMessage('不是模板,无法预览!');
		}
	});

	vscode.commands.registerCommand('extension.setProjectFolder', d => {
		utils.selectProject(d, mainProvider);
	});

	vscode.commands.registerCommand('extension.genaretorFile', () => {
		utils.genaretorFile();
	});

	const cmd = vscode.commands.registerCommand('extension.openProject', function (d) {
		const folderName = d.path + '/' + d.label;
		const folderUrl = vscode.Uri.file(folderName);
		vscode.commands.executeCommand("vscode.openFolder", folderUrl, true);
	});

	context.subscriptions.push(cmd);
	vscode.window.registerTreeDataProvider('genaretorCode', mainProvider);
}

export function deactivate() { }