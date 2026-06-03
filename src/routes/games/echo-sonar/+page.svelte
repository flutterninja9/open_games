<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	let container: HTMLElement;
	let gameInstance: any;

	onMount(async () => {
		// Lazily load the game logic only on the client
		const { createGame } = await import('./game');
		gameInstance = createGame(container);
	});

	onDestroy(() => {
		if (gameInstance) {
			gameInstance.destroy(true);
		}
	});
</script>

<svelte:head>
	<title>Echo Sonar — Open Games</title>
	<meta name="description" content="Navigate the darkness using sonar pings. Avoid the red enemies." />
</svelte:head>

<div class="page page-enter">
	<nav>
		<a href="/" class="back">← Open Games</a>
	</nav>
	
	<h1 class="title">Echo Sonar</h1>
	<p class="desc">
		Total darkness. Tap/click to emit a sonar ping. Navigate the maze to the green exit using limited pings.
		Use WASD or Arrow Keys to move. Red enemies are deadly.
	</p>
	
	<div class="game-container" bind:this={container}></div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1.5rem 5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	nav {
		width: 100%;
		margin-bottom: 2rem;
	}

	.back {
		font-size: 0.8125rem;
		color: var(--gray-500);
		letter-spacing: 0.02em;
		transition: color 0.12s ease;
	}

	.back:hover { color: var(--gray-300); }

	.title {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		font-weight: 500;
		letter-spacing: -0.03em;
		color: var(--white);
		margin-bottom: 0.5rem;
		align-self: flex-start;
	}

	.desc {
		font-size: 0.875rem;
		color: var(--gray-400);
		margin-bottom: 2rem;
		align-self: flex-start;
		max-width: 600px;
		line-height: 1.5;
	}

	.game-container {
		width: 800px;
		height: 520px;
		background: #000;
		border: 1px solid var(--gray-800);
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0,0,0,0.5);
	}
</style>
