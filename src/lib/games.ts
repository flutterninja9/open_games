export interface Game {
	id: string;
	title: string;
	description: string;
	path: string;
	players: string;
	tags: string[];
}

export const games: Game[] = [
	{
		id: 'tic-tac-toe',
		title: 'Tic Tac Toe',
		description: 'Classic 3×3 grid. Two players, one winner.',
		path: '/games/tic-tac-toe',
		players: '2 Players',
		tags: ['classic', 'strategy', '2-player']
	},
	{
		id: 'echo-sonar',
		title: 'Echo Sonar',
		description: 'Total darkness. Tap to emit a sonar ping. Navigate the maze to escape.',
		path: '/games/echo-sonar',
		players: '1 Player',
		tags: ['atmospheric', 'puzzle', 'stealth']
	}
];
