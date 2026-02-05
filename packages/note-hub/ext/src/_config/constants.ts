const EXT_ID_PREFIX = 'nh'

export const constants = {
	extension: {
		name: 'F-UX: Notes Hub',
		nickName: 'NH',
		id: `${EXT_ID_PREFIX}`,
		configKey: `${EXT_ID_PREFIX}`,
	},
	commands: {
		newProjectFolder: `${EXT_ID_PREFIX}.newProjectFolder`,
		newGlobalFolder: `${EXT_ID_PREFIX}.newGlobalFolder`,
		newProjectNote: `${EXT_ID_PREFIX}.newProjectNote`,
		newGlobalNote: `${EXT_ID_PREFIX}.newGlobalNote`,
		newNestedNote: `${EXT_ID_PREFIX}.newNestedNote`,
		newNestedFolder: `${EXT_ID_PREFIX}.newNestedFolder`,
		openNote: `${EXT_ID_PREFIX}.openNote`,
		openNotePreview: `${EXT_ID_PREFIX}.openNotePreview`,
		addFrontmatter: `${EXT_ID_PREFIX}.addFrontmatter`,
		copyItem: `${EXT_ID_PREFIX}.copyItem`,
		cutItem: `${EXT_ID_PREFIX}.cutItem`,
		pasteItem: `${EXT_ID_PREFIX}.pasteItem`,
		renameItem: `${EXT_ID_PREFIX}.renameItem`,
		deleteItem: `${EXT_ID_PREFIX}.deleteItem`,
	},
	views: {
		container: 'notesHub',
		project: `${EXT_ID_PREFIX}.projectNotesView`,
		global: `${EXT_ID_PREFIX}.globalNotesView`,
	},
} as const