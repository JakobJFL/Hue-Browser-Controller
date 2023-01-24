/*
    Extremely simple visitor counter
*/

countVisit();
countUniqueVisit();

function countVisit() {
    fetch('https://api.countapi.xyz/hit/Open-Hue-views-89148606587/visits')
	.catch(err => console.error(err));
}

function countUniqueVisit() {
    if (localStorage.getItem('hasVisited') !== "true") {
        localStorage.setItem('hasVisited', true);
        console.log(localStorage.getItem('hasVisited'))
        fetch('https://api.countapi.xyz/hit/Open-Hue-views-891486501487/uniqueVisits')
        .catch(err => console.error(err));
    }
}