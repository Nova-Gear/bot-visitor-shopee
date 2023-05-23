const puppeteer = require('puppeteer');
// https://shopee.co.id/api/v4/item/get?itemid=1335982304&shopid=39910038
const itemid = '10347294835';
const shopid = '6253819';
const url_product = shopid+'.'+itemid;
const keywords = 'sepatu'
var page_no = 0;

const findLink = async (list_links, text) => {
    for(var i = 0; i < list_links.length; i++){
        let ele_link = await list_links[i].getProperty('innerText');
        let link = await ele_link.jsonValue();
        
        if(link.includes(text)){
            await list_links[i].click();
            return;
        }

    }
    return null;
}

const autoScroll = async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const findProduct = async (page,url_product) => {

    page_no = page_no + 1;
    console.log('Find Product On Page '+ page_no);

    // scroll to end of page
    await autoScroll(page);
    
    // list all link result
    var list_links = await page.$$('a');

    // find link by text and click
    for(var i = 0; i < list_links.length; i++){
        let ele_link = await list_links[i].getProperty('href');
        let link = await ele_link.jsonValue();
        
        if(link.includes(url_product)){
            await list_links[i].click();
            return true;
        }
    }

    /**
     * When loop is finished but not click any link, 
     * then click next page and find again,
     * stop click when it reach max page
     */

    // wait element next page
    var ele_max = await page.$('span.shopee-mini-page-controller__total');
    var max_page = await ele_max.evaluate(el => el.textContent); 

    // check if reach end of page, then return
    if(page_no == max_page){
        console.log("Reach End of Pages");
        return false;
    }

    // wait element next page
    await page.waitForSelector('button.shopee-icon-button.shopee-icon-button--right');

    // click next page
    await page.click('button.shopee-icon-button.shopee-icon-button--right');

    // find product again
    await findProduct(page, url_product);
}

(async () => {
    try {

        console.log('Opening Browser')
        // initialize browser
        const browser = await puppeteer.launch({ headless: false });

        console.log('Opening New Tab')
        // open new page
        const page = await browser.newPage();

        console.log('Set View Area')
        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        console.log('Go to Google')
        // go to page and wait until all element loaded
        await page.goto('https://www.google.com/', { timeout: 60000, waitUntil: 'domcontentloaded' });

        console.log('Wait for element input')
        // wait input loaded
        await page.waitForSelector('input.gLFyf');

        console.log('Typing Shopee')
        // type shopee with delay 100ms
        await page.type('input.gLFyf', 'Shopee', { delay: 100 });
        
        console.log('Press Enter')
        // press enter
        await page.keyboard.press('Enter');

        console.log('Waiting for search results')
        // wait search result 
        await page.waitForSelector('#rso');

        console.log('Get all links')
        // list all link result
        var list_links = await page.$$('a');
        
        console.log('Finding Shopee link')
        // find link by text and click
        await findLink(list_links, 'shopee');
        console.log('Going to shopee')
        
        console.log('Waiting shopee input')
        // wait until search bar is loaded
        await page.waitForSelector('input.shopee-searchbar-input__input');

        console.log('typing keywords', keywords)
        // type your product or store
        await page.type('input.shopee-searchbar-input__input',keywords,{delay:200});

        console.log('Press Enter')
        // press enter
        await page.keyboard.press('Enter');

        console.log('Waiting for results')
        // wait page loaded
        await page.waitForNavigation({waitUntil: 'networkidle0'});
        
        console.log('Finding Products')
        // find your product then click it
        await findProduct(page, url_product);

        console.log('Closing Browser!')
        // then close the browser
        await browser.close();

    } catch (error) {
        console.log(error);
    }
})();
