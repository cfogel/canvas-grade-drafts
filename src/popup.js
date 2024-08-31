var port = chrome.runtime.connect({name: 'popup'})
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
document.getElementById("action-buttons").addEventListener('click', async (event) => {
    port.postMessage([event.target.name,tab])
})