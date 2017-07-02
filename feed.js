const harp = require('./harp.json').globals;
const RSS = require('rss');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');

const rootUrl = harp.root_url.production;
const categoryDir = path.join(__dirname, 'public/_categories');
const imageRootUrl = `${rootUrl}assets/images/`;
const outputFeed = 'www/rss.xml';
const maps = [];
const feed = new RSS({
  title: harp.title,
  description: harp.description,
  feed_url: `${rootUrl}rss.xml`,
  site_url: rootUrl,
  image_url: `${imageRootUrl}${harp.slug_title}-thumb.png`,
  managingEditor: harp.author,
  pubDate: moment().format('LLLL'),
  ttl: 60
});

fs.readdirSync(categoryDir).forEach((categoryFile) => {
  const categoryName = categoryFile.replace('.json', '');
  const category = require(path.join(categoryDir, categoryFile)).index;
  category.maps.forEach((map) => {
    const mapId = map.title.replace(/[^\w\s]/g, '').replace(/\s/g, '-').toLowerCase();
    const mapLink = `${rootUrl}${categoryName}/#${mapId}`;
    const mapImage = map.image || `${categoryName}.png`;
    const mapPublishedAt = moment(map.added_at || moment().format('YYYYMMDD'), 'YYYYMMDD');
    maps.push({
      title: `${map.paid_map ? 'Sponsored' : 'Free'} map: ${map.title}`,
      description: `
        <article>
          <figure style="text-align:center;">
            <img src="${imageRootUrl}${mapImage}" title="${map.title}" />
            <figcaption>${map.title}</figcaption>
          </figure>
          <p>
            ${map.description}
            <br />
            Author: <b>${map.author}</b> | Section: <b>${category.subtitle}</b>
            <br />
            Lang: <b>${map.lang}</b> | Pages: <b>${map.pages}</b> | Year: <b>${map.year}</b>
          </p>
        </article>
      `,
      url: mapLink,
      author: harp.author,
      date: mapPublishedAt.format('ll')
    });
  });
});

const sortedMaps = maps.sort((first, second) => {
  const a = moment(first.date, 'll').toDate().getTime();
  const b = moment(second.date, 'll').toDate().getTime();
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
});

sortedMaps.forEach(map => feed.item(map));

fs.writeFileSync(outputFeed, feed.xml());
console.log(`Generated RSS: ${outputFeed}`);
