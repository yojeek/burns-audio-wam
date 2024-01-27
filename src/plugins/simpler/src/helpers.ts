export async function loadSample(audioContext: BaseAudioContext, url: string, instanceId: string) {
    if (window.WAMExtensions?.assets?.loadAsset) {
        const asset = await window.WAMExtensions.assets.loadAsset(instanceId, url);

        if (!asset) {
            console.warn(`SimplerNode.setState: asset not found`);
            return
        }

        const buffer = await asset.content.arrayBuffer();
        return await audioContext.decodeAudioData(buffer);
    } else {
        return await fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error, status = ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then((buffer) => audioContext.decodeAudioData(buffer))
    }


}
