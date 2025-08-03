import { Position } from 'vscode'
import type { IPosition } from '../../_interfaces/IVSCode.js'

export class PositionAdapter implements IPosition {
	create(line: number, character: number) {
		return new Position(line, character)
	}
} 