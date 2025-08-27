/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Generates a random Amidakuji structure.
 * @param {number} count The number of participants.
 * @returns {{lines: Array<{y: number, left: number, right: number}>, results: Array<number>}}
 */
export function generateAmida(count) {
    const lines = [];
    const numRows = count * 2;
    const availableRows = Array.from({ length: numRows }, (_, i) => i);
    shuffle(availableRows);

    // Add a random number of horizontal lines
    const lineCount = Math.floor(count * 1.5) + 1;

    for (let i = 0; i < lineCount; i++) {
        if (availableRows.length === 0) break;
        const row = availableRows.pop();

        // Find a random pair of adjacent vertical lines
        const left = Math.floor(Math.random() * (count - 1));
        const right = left + 1;

        // Avoid placing lines too close to each other on the same vertical tracks
        const isOccupied = lines.some(line => 
            ((line.left === left && line.right === right) || 
             (line.left === left - 1 && line.right === left) || 
             (line.left === right && line.right === right + 1)) &&
            (Math.abs(line.y - row) < 2)
        );

        if (!isOccupied) {
            lines.push({ y: row, left, right });
        }
    }

    // Calculate the final results based on the generated lines
    const sortedLines = lines.sort((a, b) => a.y - b.y);
    const results = Array.from({ length: count }, (_, i) => i);

    for (const line of sortedLines) {
        const { left, right } = line;
        [results[left], results[right]] = [results[right], results[left]];
    }

    return { lines: sortedLines, results };
}