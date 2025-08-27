<script>
	let { 
		participants = [], 
		prizes = [], 
		lines = [], 
		tracePaths = [], 
		showPrizes = false, 
		showLines = true, 
		selectedIndex = -1, 
		onSelect = (i) => {}
	} = $props();

	// --- SVG Dimensions and Layout ---
	const width = 600;
	const height = 400;
	const paddingTop = 50;
	const paddingBottom = 50;
	const paddingX = 50;

	const amidaHeight = height - paddingTop - paddingBottom;
	const numVerticals = participants.length;
	const verticalSpacing = numVerticals > 1 ? (width - paddingX * 2) / (numVerticals - 1) : 0;

	// --- Calculated SVG data (These are derived reactively) ---
	const verticalLines = Array.from({ length: numVerticals }, (_, i) => ({
		x: paddingX + i * verticalSpacing,
		y1: paddingTop,
		y2: height - paddingBottom
	}));

	const getHLineY = (y) => paddingTop + (amidaHeight / (numVerticals * 2 + 1)) * (y + 1);

	const horizontalLines = lines.map((line) => ({
		x1: verticalLines[line.left].x,
		x2: verticalLines[line.right].x,
		y: getHLineY(line.y)
	}));

	// --- Path Animation ---
	let pathElement = $state(null);
	let pathLength = $state(0);

	$effect(() => {
		if (pathElement) {
			pathLength = pathElement.getTotalLength();
		}
	});

</script>

<div class="amida-container">
	<svg viewBox="0 0 {width} {height}" class="amida-svg">
		<!-- Vertical Lines -->
		{#each verticalLines as vline}
			<line x1={vline.x} y1={vline.y1} x2={vline.x} y2={vline.y2} stroke="#333" stroke-width="2" />
		{/each}

		<!-- Horizontal Lines (Conditional) -->
		{#if showLines}
			{#each horizontalLines as hline}
				<line x1={hline.x1} y1={hline.y} x2={hline.x2} y2={hline.y} stroke="#333" stroke-width="2" />
			{/each}
		{/if}

		<!-- Trace Path -->
		{#if showPrizes && selectedIndex !== -1}
			{#key selectedIndex}
				<path
					bind:this={pathElement}
					d={tracePaths[selectedIndex]}
					stroke="hsl(217, 100%, 50%)"
					stroke-width="5"
					stroke-linecap="round"
					fill="none"
					class="trace-path"
					style="--path-length: {pathLength};"
				/>
			{/key}
		{/if}

		<!-- Participants (Top) -->
		{#each participants as name, i}
			<g class="participant-group" role="button" tabindex="0" onclick={() => onSelect(i)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(i); }}>
				<rect
					x={verticalLines[i].x - verticalSpacing / 2}
					y="0"
					width={verticalSpacing}
					height={paddingTop}
					fill="transparent"
				/>
				<text
					x={verticalLines[i].x}
					y={paddingTop - 15}
					text-anchor="middle"
					font-weight="bold"
					class:selected={selectedIndex === i}>{name}</text
				>
			</g>
		{/each}

		<!-- Prizes (Bottom) -->
		{#each prizes as prize, i}
			<text
				x={verticalLines[i].x}
				y={height - paddingBottom + 25}
				text-anchor="middle"
				font-weight="bold"
			>
				{showPrizes ? prize : '？'}
			</text>
		{/each}
	</svg>
</div>

<style>
	.amida-container {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}
	.participant-group {
		cursor: pointer;
	}
	.participant-group text {
		pointer-events: none;
		transition: fill 0.2s;
	}
	.participant-group rect {
		transition: background-color: 0.2s;
	}
	.participant-group:hover rect {
		background-color: hsla(217, 100%, 50%, 0.05);
	}
	.selected {
		fill: hsl(217, 100%, 50%);
	}

	.trace-path {
		stroke-dasharray: var(--path-length);
		stroke-dashoffset: var(--path-length);
		animation: draw-path 2s ease-out forwards;
	}

	@keyframes draw-path {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>