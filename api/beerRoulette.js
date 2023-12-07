const puppeteer = require('puppeteer');
const { os, mysqlConfig } = require('../config.json');
const mysql = require('mysql');

const args = process.argv.slice(2);

async function getRandomBeer(selectedCategories, connection) {
    const categories = [];

    if (selectedCategories['flaschenbiere'] === 'true') {
        categories.push("'Flaschenbiere'");
    }

    if (selectedCategories['dosenbiere'] === 'true') {
        categories.push("'Dosenbiere'");
    }

    if (selectedCategories['cider'] === 'true') {
        categories.push("'Cider'");
    }

    if (selectedCategories['fassbiere'] === 'true' || categories.length === 0) {
        categories.push("'Fassbiere'");
    }

    const retVal = new Promise(async resolve => {
        const beerList = await new Promise((resolve) => {
            connection.query(`SELECT id, name, image, description FROM beer WHERE category IN (${categories.toString()})`, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    resolve(result);
                }
            });
        });

        const randomBeer = beerList[Math.floor(Math.random() * beerList.length)];

        randomBeer.priceList = await new Promise((resolve) => {
            connection.query(`SELECT amount, price FROM beer_price WHERE beer_id = ${randomBeer.id}`, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    resolve(result);
                }
            });
        });

        resolve(randomBeer);
    });

    return retVal;
}

async function fetchBeers(connection) {
    // REMEMBER TO ALWAYS SWITCH TO CORRECT OS!!!
    let browser;

    if (os === 'windows') {
        browser = await puppeteer.launch({ headless: 'new' }); // WINDOWS
    } else if (os === 'linux') {
       browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' }); // LINUX
    }

    const page = await browser.newPage();
    const categories = ['Fassbiere', 'Flaschenbiere', 'Dosenbiere', 'Cider'];

    console.log("Started fetching beers...");

    await page.goto('https://app.yamnam.com/menu/finkenkrug').catch((error) => console.log(error));

    for (let category of categories) {
        // Wait for category
        const htmlCategory = await page.waitForSelector(`#${category}`).catch((error) => console.log(error));
        const htmlBeerList = await htmlCategory.$$('sal-menu-item mat-card.item');

        if (htmlBeerList.length > 0) {
            // Delete all beers
            await new Promise((resolve) => {
                connection.query(`DELETE FROM beer WHERE category = '${category}';`, (error, result) => {
                    resolve();
                    if (error) throw error;
                });
            });

            // Extract each beer
            for (let htmlBeer of htmlBeerList) {
                //Expand beer
                const expandButton = await htmlBeer.waitForSelector('mat-icon.mat-icon');
                await expandButton.evaluate(el => el.click());
                await htmlBeer.waitForSelector('.body');

                const beerId = Math.floor(Math.random() * 10000000) + 10000000;
                const beerName = await htmlBeer.$eval('.dotted-description-content-wm', el => el.innerText.replaceAll("'", '"'));
                const beerDesc = await htmlBeer.$eval('.body .dotted-description-content', el => el.innerText.replaceAll("'", '"'));
                const beerImage = await new Promise (resolve => {
                    htmlBeer.$eval('.ng-star-inserted img', el => el.getAttribute('src')).then((data) => {
                        resolve(`'${data}'`);
                    }, (error) => {
                        resolve(null);
                    })
                });

                await new Promise((resolve) => {
                    connection.query(`INSERT INTO beer VALUES(${beerId}, '${beerName}', '${beerDesc}', ${beerImage}, '${category}')`, (error, result) => {
                        resolve();
                        if (error) throw error;
                    });
                });

                const htmlPriceList = await htmlBeer.$$('.variant-container');
                const priceList = [];

                for (let htmlPrice of htmlPriceList) {
                    const amount = await htmlPrice.$eval('.variant-name', el => el.innerText.replaceAll("'", '"'));
                    const price = await htmlPrice.$eval('.variant-price', el => el.innerText.replaceAll("'", '"'));

                    await new Promise((resolve) => {
                        connection.query(`INSERT INTO beer_price VALUES(${beerId}, '${amount}', '${price}')`, (error, result) => {
                            resolve();
                            if (error) throw error;
                        });
                    });
                }
            }
        }
    }

    await browser.close();

    console.log('...fetched all beers!');
}

if (args[0] === '-fetch') {
    const connection = mysql.createConnection({
        host: mysqlConfig.host,
        database: mysqlConfig.db,
        user: mysqlConfig.user,
        password: mysqlConfig.pw
    });

    connection.connect(async (error) => {
        if (error) {
            console.error('Error connecting to MySQL:', error);
            return;
        }

        console.log('Connected to MySql Databse');
        await fetchBeers(connection);

        connection.end((error) => {
            if (error) {
                console.error('Error closing MySQL connection:', error);
                return;
            }

            console.log('MySQL connection closed.');
        });
    });
}

module.exports = {
    getRandomBeer,
    fetchBeers
};