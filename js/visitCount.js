countVisit();
countUniqueVisit();

function countVisit() {
    fetch('https://api.countapi.xyz/hit/Open-Hue-views-8914860545/visits')
	.catch(err => console.error(err));
}

function countUniqueVisit() {
    if (localStorage.getItem('hasVisited') !== "true") {
        localStorage.setItem('hasVisited', true);
        fetch('https://api.countapi.xyz/hit/Open-Hue-views-8914860545/uniqueVisits')
        .catch(err => console.error(err));
    }
}