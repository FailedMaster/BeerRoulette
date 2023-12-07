const categories = {
    fassbiere: true,
    flaschenbiere: false,
    dosenbiere: false,
    cider: false
}

//#region categories
function initCategories() {
    const categoriesElement = document.getElementById('categories');

    categoriesElement.addEventListener('click', (e) => {
        let targetElement = e.target; // Get the clicked element

        while (targetElement.tagName !== 'LI') {
            targetElement = targetElement.parentElement;
        }

        toggleCategory(targetElement.id);
    })

    renderCategories();
}

function renderCategories() {
    for (let category in categories) {
        const element = document.getElementById(`${category}`);

        if (categories[`${category}`]) {
            element.classList.add('selected');
        } else {
            element.classList.remove('selected');
        }
    }
};

function toggleCategory(category) {
    if (categories[`${category}`]) {
        categories[`${category}`] = false;
    } else {
        categories[`${category}`] = true;
    }

    renderCategories();
}
//#endregion categories

//#region roulette
function initRouletteButton() {
    const buttonElement = document.getElementById('rouletteButton');

    buttonElement.addEventListener('click', getRandomBeer)
}

async function getRandomBeer() {
    const rouletteButtonElement = document.getElementById('rouletteButton');
    const beerDataElement = document.getElementById('beerData');
    const beerNameElement = beerDataElement.querySelector('#beerName');
    const beerImageElement = beerDataElement.querySelector('#beerImage');
    const beerDescriptionElement = beerDataElement.querySelector('#beerDescription');
    const beerPriceListElement = beerDataElement.querySelector('#beerPriceList');

    rouletteButtonElement.removeEventListener('click', getRandomBeer);
    rouletteButtonElement.classList.add('spinning');

    console.log('Call getRandomBeer');
    const queryString = Object.entries(categories).map(([key, value]) => `${key}=${value}`).join('&');
    const url = `/getRandomBeer?${queryString}`;
    const beer = await fetch(url).then(response => response.json()).then(data => data);
    console.log('Recieved Beer');

    await new Promise(resolve => {
        setTimeout(() => {
            rouletteButtonElement.classList.remove('spinning');
            initRouletteButton();
            resolve();
        }, 2000)
    });

    let priceList = '';

    for (let price of beer.priceList) {
        priceList += `<li><i><span>${price.amount}:</span><span class="beer-price">${price.price}</span></i></li>`
    }

    beerNameElement.innerText = beer.name;

    if (beer.image) {
       beerImageElement.setAttribute('src', beer.image);
       beerImageElement.style.removeProperty('display');
    } else {
        beerImageElement.style.display = 'none';
    }

    beerDescriptionElement.innerText = beer.description;
    beerPriceListElement.innerHTML = priceList;
}
//#endregion roulette

document.addEventListener('DOMContentLoaded', () => {
    initCategories();
    initRouletteButton();
});