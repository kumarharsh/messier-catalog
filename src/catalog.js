import * as d3 from 'd3';
import { parse } from 'date-fns';
// import './images';

const SYMBOL_INDEX = {
  cluster: { symbol: d3.symbolTriangle, color: '#ff487e', label: 'Cluster' },
  galaxy: { symbol: d3.symbolDiamond, color: '#4f3a65', label: 'Galaxy' },
  nebula: { symbol: d3.symbolCircle, color: '#ffa1c5', label: 'Nebula' },
  planetaryNebula: {
    symbol: d3.symbolCross,
    color: '#009975',
    label: 'Planetary nebula'
  },
  supernova: { symbol: d3.symbolWye, color: '#8a00d4', label: 'Supernova' },
  others: { symbol: d3.symbolSquare, color: '#2b580c', label: 'Others' }
};

export default function plotSkyCatalog(element, catalog_data, width, height, options) {
  const margin = 50;
  const catalog = cleanCatalog(catalog_data);
  const minDec = catalog.reduce((acc, obj) => Math.min(acc, obj.dec), 0);
  const maxDec = catalog.reduce((acc, obj) => Math.max(acc, obj.dec), 0);
  const rangeDec = maxDec - minDec;
  const $tooltip = d3.select('#tooltip');
  const $infobox = d3.select('#infobox');

  window.catalog = catalog;
  window.d3 = d3;

  const xScale = d3
    .scaleLinear()
    .domain([-15, 375])
    // the right ascension values are normally represented from right to left
    // in the night sky
    .range([width, 0]);
  const yScale = d3
    .scaleLinear()
    .domain([minDec - rangeDec / 10, maxDec + rangeDec / 10])
    .range([height, 0]);

  const chart = d3
    .select(element)
    .attr('viewBox', `0 0 ${width + margin * 2} ${height + margin * 2}`)
    .attr('width', `${width + margin * 2}`)
    .attr('height', `${height + margin * 2}`);

  // append a 'chart year' label to be used to display current year of the animation
  const chartYear = chart
    .append('g')
    .attr('transform', `translate(${width + margin},${height + margin / 3})`)
    .append('text')
    .attr('class', 'chart-year');

  const minDiscovDate = catalog[0].discovDate;
  const maxDiscovDate = catalog[catalog.length - 1].discovDate;

  // setup the axes
  chart
    .append('g')
    .attr('transform', `translate(${margin},${height + margin})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickSize(-height - margin / 2)
        .tickPadding(2)
        .tickFormat(formatXTick)
    )
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick line')
        .attr('stroke-opacity', 0.1)
        .attr('y1', -20)
    )
    .call((g) =>
      g
        .selectAll('.tick text')
        .attr('x', 0)
        .attr('dy', -4)
    );
  chart
    .append('g')
    .attr('transform', `translate(${margin},${margin})`)
    .call(
      d3
        .axisRight(yScale)
        .tickSize(width)
        .tickFormat(formatYTick)
    )
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick:not(:first-of-type) line')
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '2,2')
    )
    .call((g) =>
      g
        .selectAll('.tick text')
        .attr('x', 4)
        .attr('dy', -4)
    );

  chart
    .append('text')
    .attr('text-anchor', 'middle') // this makes it easy to centre the text as the transform is applied to the anchor
    // text is drawn off the screen top left, move down and out and rotate
    .attr(
      'transform',
      `translate(${margin / 2},${height / 2 + margin}) rotate(-90)`
    )
    .text('Declination (δ) (degrees)');

  chart
    .append('text')
    .attr('text-anchor', 'middle') // this makes it easy to centre the text as the transform is applied to the anchor
    // centre below axis
    .attr(
      'transform',
      `translate(${width / 2 + margin},${height + 1.6 * margin})`
    )
    .text('Right ascension (α) (hour angles)');

  const legend = chart
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 65}, 25)`);

  legend
    .selectAll('g.legend-row')
    .data(Object.keys(SYMBOL_INDEX))
    .enter()
    .append('g')
    .attr('transform', (_, i) => `translate(0, ${i * 20})`)
    .attr('class', 'legend-row')
    .append('path')
    .attr('class', 'symbol')
    .attr('d', d3.symbol().type((d) => SYMBOL_INDEX[d].symbol))
    .attr('fill', (d) => SYMBOL_INDEX[d].color);
  legend
    .selectAll('g.legend-row')
    .append('text')
    .attr('text-anchor', 'start')
    .attr('transform', `translate(30,0)`)
    .text((d) => SYMBOL_INDEX[d].label);

  // now draw the actual chart
  if (!options.renderData) {
    return;
  }
  chart
    .append('g')
    .attr('transform', `translate(${margin}, ${margin})`)
    .selectAll('.symbol')
    .data(catalog)
    .enter()
    .append('path')
    .on('mouseenter', (d) => {
      $tooltip
        .html(
          `
          <div>
            <span class="object-id">${d['Messier number']}</span>
            <span class="object-name">${d['Common name']}</span>
            <span class="object-type">${d['Object type']}</span>
          </div>
          ${options.allowInteraction ? `<div class="cta">Click to learn more</div>` : ''}
        `
        )
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('display', 'block')
        .style('left', `${d3.event.pageX + 15}px`)
        .style('top', `${d3.event.pageY - 10}px`);
    })
    .on('mouseleave', () => {
      $tooltip
        .transition()
        .duration(200)
        .style('opacity', 0)
        .style('display', 'none');
    })
    .on('click', (d) => {
      if (!options.allowInteraction) {
        return;
      }
      const target = d3.event.currentTarget;
      d3.select(target)
        .transition()
        .duration(500)
        .attr('r', 10);
      $infobox
        .html(
          `
        <div id="close-infobox">×</div>
        <div class="messier-data-grid">
          <div class="image"><img src='src/db/images/catalog/${d['Picture']}' alt='${
            d['Messier number']
          }'></div>
          <div class="label">Messier number</div>
          <div class="value">${d['Messier number']}</div>
          <div class="label">New NGC/IC number</div>
          <div class="value">${d['NGC/IC number']}</div>
          <div class="label">Common name</div>
          <div class="value">${d['Common name']}</div>
          <div class="label">Object type</div>
          <div class="value">${d['Object type']}</div>
          <div class="label">Distance from Earth</div>
          <div class="value">${d['Distance (kly)']}</div>
          <div class="label">Constellation</div>
          <div class="value">${d['Constellation']}</div>
          <div class="label">Apparent magnitude</div>
          <div class="value">${d['Apparent magnitude']}</div>
          <div class="label">Right ascension</div>
          <div class="value">${d['Right ascension']}</div>
          <div class="label">Declination</div>
          <div class="value">${d['Declination']}</div>
        </div>
        <img class="art-image" src='src/db/images/catalog/${d['Picture']}' alt=""></div>
      `
        )
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('display', 'block')
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY}px`);

      $infobox.select('#close-infobox').on('click', () => {
        d3.select(target)
          .transition()
          .duration(500)
          .attr('r', 5);
        $infobox
          .transition()
          .duration(200)
          .style('opacity', 0)
          .style('display', 'none');
      });
    })
    .attr('class', 'symbol clickable')
    .attr(
      'transform',
      (d) => `translate(${xScale(d.ra)},${yScale(d.dec)}) scale(0)`
    )
    .attr('d', d3.symbol().type((d) => SYMBOL_INDEX[d.symbol].symbol))
    .attr('opacity', 0)
    .transition()
    .duration(1000)
    .delay(
      (d, _, list) =>
        ((d.discovDate - minDiscovDate) / (maxDiscovDate - minDiscovDate)) *
        list.length * 100
    )
    .attr(
      'transform',
      (d) => `translate(${xScale(d.ra)},${yScale(d.dec)}) scale(1)`
    )
    .attr('opacity', 1)
    .attr('fill', (d) => SYMBOL_INDEX[d.symbol].color)
    .tween("text.year", (d, i) => {
      chartYear.text(d.discovDate.getFullYear());
    });
}

function cleanCatalog(data) {
  return data.map((obj) => ({
    ...obj,
    dec: parseDeclination(obj),
    ra: parseRightAscension(obj),
    distance: parseDistance(obj),
    symbol: parseObjectType(obj),
    discovDate: parseDiscovDate(obj)
  }));
}

function parseDistance(obj) {
  const vals = obj['Distance (kly)']
    .split('–')
    .map((d) => Number.parseFloat(d.replace(/[~,]/g, '')));
  return vals.reduce((sum, v) => sum + v, 0) / vals.length;
}

function parseRightAscension(obj) {
  // Right ascension (α) is measured in 'hour angles' which are related to
  // the sexagesimal degrees and minutes in this ratio:
  // 1h = 15°
  // 1m = 1/4°
  // 1s = 1/240°
  // source: https://en.wikipedia.org/wiki/Right_ascension
  const vals = obj['Right ascension']
    .trim()
    .match(/(?:([\d\.]+)h)?\s*(?:([\d\.]+)m)?\s*(?:([\d\.]+)s)?/);
  const h = vals[1] ? parseFloat(vals[1]) : 0;
  const m = vals[2] ? parseFloat(vals[2]) : 0;
  const s = vals[3] ? parseFloat(vals[3]) : 0;
  return h * 15 + m / 4 + s / 240;
}

function parseDeclination(obj) {
  // Declination (δ) is measured in the sexagesimal degrees.
  // source: https://en.wikipedia.org/wiki/Declination
  const vals = obj['Declination']
    .trim()
    .match(/([-\+])(?:([\d\.]+)°)?\s*(?:([\d\.]+)′)?\s*(?:([\d\.]+)″)?/);
  const sign = vals[1] === '-' ? -1 : 1;
  const d = vals[2] ? parseFloat(vals[2]) : 0;
  const m = vals[3] ? parseFloat(vals[3]) : 0;
  const s = vals[4] ? parseFloat(vals[4]) : 0;
  return sign * (d + m / 60 + s / 3600);
}

function parseObjectType(obj) {
  switch (obj['Object type'].trim()) {
    case 'Cluster, globular':
    case 'Cluster, open':
      return 'cluster';
    case 'Galaxy, spiral':
    case 'Galaxy, dwarf elliptical':
    case 'Galaxy, starburst':
    case 'Galaxy, lenticular':
    case 'Galaxy, elliptical':
    case 'Galaxy, barred spiral':
      return 'galaxy';
    case 'Nebula, diffuse':
    case 'Nebula with cluster':
    case 'Nebula, H II region with cluster':
    case 'Nebula, H II region':
    case 'Nebula, H II region (part of the Orion Nebula)':
      return 'nebula';
    case 'Nebula, planetary':
      return 'planetaryNebula';
    case 'Supernova remnant':
      return 'supernova';
    default:
      return 'others';
  }
}

function formatYTick(d) {
  return `${d}°`;
}
function formatXTick(d) {
  return `${Math.floor(d / 15)}h`;
}
function parseDiscovDate(d) {
  return parse(d.discoveryDate, 'uuuu MMM dd', new Date());
}
