<script lang="ts">
	import { games } from '$lib/games';
</script>

<svelte:head>
	<title>Open Games</title>
	<meta name="description" content="A lightweight collection of open-source browser games. Click any game to load and play instantly." />
</svelte:head>

<main class="page-enter">
	<header>
		<div class="wordmark">Open Games</div>
		<p class="tagline">Pick a game. Play instantly.</p>
	</header>

	<section class="grid" aria-label="Game library">
		{#each games as game (game.id)}
			<a href={game.path} class="card" aria-label="Play {game.title}">
				<div class="card-inner">
					<div class="card-top">
						<span class="card-title">{game.title}</span>
						<span class="card-players">{game.players}</span>
					</div>
					<p class="card-desc">{game.description}</p>
					<div class="card-tags">
						{#each game.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
					<span class="card-cta">Play →</span>
				</div>
			</a>
		{/each}
	</section>

	<footer>
		<span>{games.length} game{games.length !== 1 ? 's' : ''} available</span>
	</footer>
</main>

<style>
	main {
		max-width: 720px;
		margin: 0 auto;
		padding: 4rem 1.5rem 6rem;
	}

	/* ── Header ── */
	header {
		margin-bottom: 3.5rem;
	}

	.wordmark {
		font-size: clamp(1.5rem, 4vw, 2rem);
		font-weight: 500;
		letter-spacing: -0.04em;
		color: var(--white);
	}

	.tagline {
		margin-top: 0.35rem;
		font-size: 0.875rem;
		color: var(--gray-500);
		letter-spacing: 0.01em;
	}

	/* ── Grid ── */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1px;
		border: 1px solid var(--gray-800);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--gray-800); /* shows as gaps */
	}

	/* ── Card ── */
	.card {
		display: block;
		background: var(--gray-950);
		transition: background 0.15s ease;
		position: relative;
	}

	.card:hover {
		background: var(--gray-900);
	}

	.card:hover .card-cta {
		opacity: 1;
		transform: translateX(0);
	}

	.card-inner {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 160px;
	}

	.card-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 500;
		color: var(--white);
		letter-spacing: -0.01em;
	}

	.card-players {
		font-size: 0.7rem;
		color: var(--gray-500);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.card-desc {
		font-size: 0.8125rem;
		color: var(--gray-400);
		line-height: 1.5;
		flex: 1;
	}

	.card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.25rem;
	}

	.tag {
		font-size: 0.65rem;
		color: var(--gray-500);
		border: 1px solid var(--gray-800);
		border-radius: 2px;
		padding: 0.1rem 0.4rem;
		letter-spacing: 0.03em;
	}

	.card-cta {
		display: inline-block;
		font-size: 0.75rem;
		color: var(--gray-300);
		margin-top: 0.5rem;
		opacity: 0;
		transform: translateX(-4px);
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
		letter-spacing: 0.02em;
	}

	/* ── Footer ── */
	footer {
		margin-top: 3rem;
		font-size: 0.75rem;
		color: var(--gray-700);
		letter-spacing: 0.03em;
	}
</style>
