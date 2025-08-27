<script>
	import { generateAmida } from '$lib/amida-generator.js';
	import AmidaDisplay from '$lib/AmidaDisplay.svelte';

	let view = $state('settings'); // 'settings' | 'placement' | 'amida' | 'result'

	// --- Settings View ---
	let participantCount = $state(4);
	let participants = $state(Array.from({ length: 4 }, () => ''));
	let prizes = $state(Array.from({ length: 4 }, () => ''));
	let cheatPairs = $state([]);
	let selectedParticipantIndex = $state(-1);
	let selectedPrizeIndex = $state(-1);

	// --- Placement View ---
	let placementOrder = $state([]);
	let placedParticipants = $derived(placementOrder.map(i => participants[i]));

	// --- Amida/Result View ---
	let amidaLines = $state([]);
	let amidaResults = $state([]);
	let finalPrizes = $state([]); // The reordered prize list for display
	let tracePaths = $state([]); // Holds all trace path data
	let selectedAmidaIndex = $state(-1);

	function handleCountChange(event) {
		const newCount = parseInt(event.target.value, 10);
		if (isNaN(newCount) || newCount < 2 || newCount > 20) return;

		participantCount = newCount;
		const oldParticipants = participants;
		const oldPrizes = prizes;
		participants = Array.from({ length: newCount }, (_, i) => oldParticipants[i] || '');
		prizes = Array.from({ length: newCount }, (_, i) => oldPrizes[i] || '');
		cheatPairs = cheatPairs.filter(p => p.participantIndex < newCount && p.prizeIndex < newCount);
	}

	function goToPlacement() {
		if (participants.some(p => p.trim() === '') || prizes.some(p => p.trim() === '')) {
			alert('すべての参加者名と景品名を入力してください。');
			return;
		}
		placementOrder = Array.from({ length: participantCount }, (_, i) => i);
		view = 'placement';
	}

	// --- Path Calculation ---
	function calculateAllTracePaths(lines) {
		const paths = [];
		const width = 600, height = 400, paddingTop = 50, paddingBottom = 50, paddingX = 50;
		const amidaHeight = height - paddingTop - paddingBottom;
		const verticalSpacing = participantCount > 1 ? (width - paddingX * 2) / (participantCount - 1) : 0;
		const verticalLinesX = Array.from({ length: participantCount }, (_, i) => paddingX + i * verticalSpacing);
		const getHLineY = (y) => paddingTop + (amidaHeight / (participantCount * 5 + 1)) * (y + 1);

		for (let i = 0; i < participantCount; i++) {
			let currentVLineIndex = i;
			let path = `M ${verticalLinesX[currentVLineIndex]} ${paddingTop}`;
			const sortedLines = [...lines].sort((a, b) => a.y - b.y);

			for (const line of sortedLines) {
				const y = getHLineY(line.y);
				if (line.left === currentVLineIndex) {
					path += ` L ${verticalLinesX[currentVLineIndex]} ${y}`;
					path += ` L ${verticalLinesX[line.right]} ${y}`;
					currentVLineIndex = line.right;
				} else if (line.right === currentVLineIndex) {
					path += ` L ${verticalLinesX[currentVLineIndex]} ${y}`;
					path += ` L ${verticalLinesX[line.left]} ${y}`;
					currentVLineIndex = line.left;
				}
			}
			path += ` L ${verticalLinesX[currentVLineIndex]} ${height - paddingBottom}`;
			paths.push(path);
		}
		return paths;
	}

	function startAmida() {
		if (new Set(placementOrder).size !== participantCount) {
			alert('各参加者は一度ずつしか配置できません。');
			return;
		}

		const { lines, results } = generateAmida(participantCount);
		amidaLines = lines;
		amidaResults = results;

		const newPrizeOrder = new Array(participantCount).fill(null);
		const prizePlaced = new Array(participantCount).fill(false);
		const transformedCheatPairs = cheatPairs.map(pair => ({ ...pair, placedParticipantIndex: placementOrder.indexOf(pair.participantIndex) }));

		for (const pair of transformedCheatPairs) {
			const start = pair.placedParticipantIndex;
			const prize = prizes[pair.prizeIndex];
			const destination = results[start];
			newPrizeOrder[destination] = prize;
			prizePlaced[pair.prizeIndex] = true;
		}

		let remainingPrizeIndex = 0;
		for (let i = 0; i < participantCount; i++) {
			if (newPrizeOrder[i] === null) {
				while (prizePlaced[remainingPrizeIndex]) { remainingPrizeIndex++; }
				newPrizeOrder[i] = prizes[remainingPrizeIndex];
				prizePlaced[remainingPrizeIndex] = true;
			}
		}
		finalPrizes = newPrizeOrder;
		tracePaths = calculateAllTracePaths(lines);

		view = 'amida';
	}

	function showResult() {
		if (selectedAmidaIndex === -1) {
			alert('参加者を選択してください。');
			return;
		}
		view = 'result';
	}

	function reset() {
		view = 'settings';
		participantCount = 4;
		participants = Array.from({ length: 4 }, () => '');
		prizes = Array.from({ length: 4 }, () => '');
		cheatPairs = [];
		placementOrder = [];
		amidaLines = [];
		amidaResults = [];
		finalPrizes = [];
		tracePaths = [];
		selectedAmidaIndex = -1;
	}

	function addCheatPair() {
		if (selectedParticipantIndex === -1 || selectedPrizeIndex === -1) return;
		cheatPairs = [...cheatPairs, { participantIndex: selectedParticipantIndex, prizeIndex: selectedPrizeIndex }];
		selectedParticipantIndex = -1;
		selectedPrizeIndex = -1;
	}

	function removeCheatPair(indexToRemove) {
		cheatPairs = cheatPairs.filter((_, i) => i !== indexToRemove);
	}

</script>

<svelte:head>
	<title>{view === 'settings' ? 'イカサマあみだくじ' : 'あみだくじ'}</title>
	<meta name="description" content="イカサマができるあみだくじアプリ" />
</svelte:head>

<div class="container">
	<h1>{view === 'settings' ? 'イカサマあみだくじ' : 'あみだくじ'}</h1>

	{#if view === 'settings'}
		<section class="settings">
			<h2>設定</h2>
			<div class="form-group">
				<label for="participantCount">参加人数</label>
				<input type="number" id="participantCount" value={participantCount} oninput={handleCountChange} min="2" max="20">
			</div>

			<div class="form-grid">
				<div>
					<h3>参加者名</h3>
					{#each { length: participantCount } as _, i}
						<input type="text" bind:value={participants[i]} placeholder={`参加者 ${i + 1}`} />
					{/each}
				</div>
				<div>
					<h3>景品名</h3>
					{#each { length: participantCount } as _, i}
						<input type="text" bind:value={prizes[i]} placeholder={`景品 ${i + 1}`} />
					{/each}
				</div>
			</div>

			<div class="cheat-settings">
				<h3>イカサマ設定</h3>
				<div class="cheat-form">
					<select bind:value={selectedParticipantIndex}>
						<option value={-1}>参加者を選択...</option>
						{#each participants as name, i}
							{#if name.trim() !== ''}
								<option value={i} disabled={cheatPairs.some(p => p.participantIndex === i)}>{name}</option>
							{/if}
						{/each}
					</select>
					<span>→</span>
					<select bind:value={selectedPrizeIndex}>
						<option value={-1}>景品を選択...</option>
						{#each prizes as prize, i}
							{#if prize.trim() !== ''}
								<option value={i} disabled={cheatPairs.some(p => p.prizeIndex === i)}>{prize}</option>
							{/if}
						{/each}
					</select>
					<button onclick={addCheatPair} class="small-button">ペア追加</button>
				</div>
				<ul class="cheat-list">
					{#each cheatPairs as pair, i}
						<li>
							<span>{participants[pair.participantIndex] || 'N/A'} → {prizes[pair.prizeIndex] || 'N/A'}</span>
							<button onclick={() => removeCheatPair(i)} class="remove-button">×</button>
						</li>
					{/each}
				</ul>
			</div>

			<button onclick={goToPlacement}>配置選択へ進む</button>
		</section>
	{/if}

	{#if view === 'placement'}
		<section class="placement">
			<h2>参加者の配置</h2>
			<p>あみだくじのスタート位置に参加者を割り当ててください。</p>
			<div class="placement-grid">
				{#each { length: participantCount } as _, i}
					<div class="placement-slot">
						<label>位置 {i + 1}</label>
						<select bind:value={placementOrder[i]}>
							<option value={-1} disabled>選択してください</option>
							{#each participants as name, pIndex}
								<option value={pIndex}>
									{name}
								</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>
			<button onclick={startAmida}>くじ引きを開始</button>
		</section>
	{/if}

	{#if view === 'amida'}
		<section class="amida-view">
			<h2>あみだくじ</h2>
			<p>運命の分かれ道！好きな縦線を選んでください。</p>
			<AmidaDisplay 
				participants={placedParticipants}
				prizes={finalPrizes}
				lines={amidaLines}
				tracePaths={tracePaths}
				showPrizes={false}
				showLines={false}
				selectedIndex={selectedAmidaIndex}
				onSelect={(i) => selectedAmidaIndex = i}
			/>
			<button onclick={showResult}>結果を見る</button>
		</section>
	{/if}

	{#if view === 'result'}
		<section class="result-view">
			<h2>結果発表</h2>
			<AmidaDisplay 
				participants={placedParticipants}
				prizes={finalPrizes}
				lines={amidaLines}
				tracePaths={tracePaths}
				showPrizes={true}
				showLines={true}
				selectedIndex={selectedAmidaIndex}
				onSelect={(i) => selectedAmidaIndex = i}
			/>
			<button onclick={reset}>最初からやり直す</button>
		</section>
	{/if}

</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: sans-serif;
		text-align: center;
	}

	section {
		margin-top: 2rem;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		margin-right: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.form-grid input {
		display: block;
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		box-sizing: border-box;
	}

	button {
		padding: 0.8rem 1.5rem;
		font-size: 1rem;
		cursor: pointer;
		border: none;
		background-color: #007bff;
		color: white;
		border-radius: 4px;
		margin-top: 1rem;
	}

	button:hover {
		background-color: #0056b3;
	}
	
	.cheat-settings {
		margin-top: 2rem;
		padding: 1.5rem;
		border: 1px solid #f0ad4e;
		border-radius: 8px;
		background-color: #fcf8e3;
	}

	.cheat-settings h3 {
		margin-top: 0;
		color: #8a6d3b;
	}

	.cheat-form {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.cheat-form select {
		padding: 0.5rem;
	}

	.small-button {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		margin-top: 0;
	}

	.cheat-list {
		list-style: none;
		padding: 0;
		margin: 0;
		max-width: 400px;
		margin: 1rem auto 0;
	}

	.cheat-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #eee;
	}
	
	.cheat-list li:last-child {
		border-bottom: none;
	}

	.remove-button {
		background: #d9534f;
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		line-height: 24px;
		text-align: center;
		padding: 0;
		cursor: pointer;
		margin-top: 0;
	}
	
	.remove-button:hover {
		background: #c9302c;
	}

	.placement-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin: 2rem 0;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}
	.placement-slot label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}
	.placement-slot select {
		width: 100%;
		padding: 0.5rem;
	}
</style>