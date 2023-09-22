export async function loadSample(audioContext: BaseAudioContext, url: string) {
    return await fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error, status = ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then((buffer) => audioContext.decodeAudioData(buffer))
}
