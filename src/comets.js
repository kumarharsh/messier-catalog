import * as d3 from 'd3';
import { parse } from 'date-fns';

const MESSIER_BIRTH = '26-Jun-1730';
const MESSIER_DEATH = '12-Apr-1817';
export default function plotCometDiscoveries(
  element,
  cometsData,
  marks,
  width,
  height,
  options
) {
  const margin = 50;
  const comets = cometsData.map((comet) => ({
    ...comet,
    startDate: parse(comet['Start Observation'], 'dd-MMM-uuuu', new Date()),
    endDate: parse(comet['End Observation'], 'dd-MMM-uuuu', new Date())
  }));
  const minDate = parse(MESSIER_BIRTH, 'dd-MMM-uuuu', new Date());
  const maxDate = parse(MESSIER_DEATH, 'dd-MMM-uuuu', new Date());

  const $tooltip = d3.select('#tooltip');
  const $infobox = d3.select('#infobox');

  const xScale = d3
    .scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);
  const yScale = d3
    .scaleBand()
    .domain(Array.from({ length: comets.length }, (_, i) => i + 1))
    .range([0, height]);
  const chart = d3
    .select(element)
    .attr('viewBox', `0 0 ${width + margin * 2} ${height + margin * 2}`)
    .attr('width', `${width + margin * 2}`)
    .attr('height', `${width + margin * 2}`);

  const legend = chart
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 65}, ${margin})`);

  legend
    .selectAll('g.legend-row')
    .data(['!', 'c'])
    .enter()
    .append('g')
    .attr('transform', (_, i) => `translate(0, ${i * 20})`)
    .attr('class', 'legend-row')
    .append('rect')
    .attr('width', 5)
    .attr('height', 15)
    .attr('x', 0)
    .attr('y', -10)
    .attr('fill', (d) => (d === '!' ? '#3e64ff' : '#5edfff'));
  legend
    .selectAll('g.legend-row')
    .append('text')
    .attr('text-anchor', 'start')
    .attr('transform', `translate(10,0)`)
    .text((d) => (d === '!' ? 'Discovered' : 'Co-discovered'));

  // axes
  chart
    .append('g')
    .attr('transform', `translate(${margin},${height + margin})`)
    .call(d3.axisBottom(xScale));
  chart
    .append('g')
    .attr('transform', `translate(${margin},${margin})`)
    .call(d3.axisLeft(yScale).tickSize(-width))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick line')
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '2,2')
    )
    .call((g) =>
      g
        .selectAll('.tick text')
        .attr('x', 15)
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
    .text('Comet number');

  chart
    .append('text')
    .attr('text-anchor', 'middle') // this makes it easy to centre the text as the transform is applied to the anchor
    // centre below axis
    .attr(
      'transform',
      `translate(${width / 2 + margin},${height + 1.8 * margin})`
    )
    .text('Year');

  if (!options.renderData) {
    return;
  }

  chart
    .append('g')
    .attr('transform', `translate(${margin}, ${margin})`)
    .selectAll('rect')
    .data(comets)
    .enter()
    .append('rect')
    .attr('class', 'clickable')
    .on('mouseenter', (d) => {
      $tooltip
        .html(
          `
          <div>
            <span class="object-id">${d['Comet']}</span>
            <span class="object-name">${d['Desig. new']}</span>
            <span class="object-type">${d['Disco. Date']}</span>
          </div>
          ${
            options.allowInteraction
              ? '<div class="cta">Click to learn more</div>'
              : ''
          }
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
      $infobox
        .html(
          `
        <div id="close-infobox">×</div>
        <div class="messier-data-grid comet-grid">
          <div class="image"></div>
          <div class="label">Comet</div>
          <div class="value">${d['Desig. new']}</div>
          <div class="label">Messier's Designation</div>
          <div class="value">${d['Desig. Messier']}</div>
          <div class="label">Discovered by</div>
          <div class="value">${d['Discoverers']}</div>
          <div class="label">Official discovery date</div>
          <div class="value">${d['Disco. Date']}</div>
          <div class="label">First sighted by Messier</div>
          <div class="value">${d['Start Observation']}</div>
          <div class="label">Last sighted</div>
          <div class="value">${d['End Observation']}</div>
          <div class="label">Days observed</div>
          <div class="value">${d['d']}</div>
        </div>
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
    .attr('fill', (d) => (d.t === '!' ? '#3e64ff' : '#5edfff'))
    .attr('x', (d) => xScale(d.startDate))
    .attr('y', (_, i) => yScale(i + 1))
    .attr('height', () => yScale.bandwidth())
    .transition()
    .delay((_, i) => i * 200)
    .attr('width', (d) => xScale(d.endDate) - xScale(d.startDate) + 5);
  chart
    .append('g')
    .attr('transform', `translate(${margin}, ${margin})`)
    .selectAll('text.comet-name')
    .data(comets)
    .enter()
    .append('text')
    .attr('class', 'comet-name')
    .attr('text-anchor', 'start')
    .attr('x', (d) => xScale(d.endDate))
    .attr('dx', 15)
    .attr('y', (_, i) => yScale(i + 1))
    .attr('dy', 10)
    .text((d) => d['Desig. new'])
    .attr('opacity', 0)
    .transition()
    .delay((_, i, list) => list.length * 200 + 500 + i * 50)
    .attr('opacity', 1);

  chart
    .append('g')
    .attr('transform', `translate(${margin}, ${margin})`)
    .selectAll('g.discovery-mark')
    .data(marks.map(parseDiscovDate))
    .enter()
    .append('g')
    .attr('class', 'discovery-mark')
    .append('line')
    .transition()
    .delay(6000)
    .attr('stroke', (_, i) => (i === 0 ? '#8a00d4' : '#ffa1c5'))
    .attr('x1', (d) => xScale(d))
    .attr('x2', (d) => xScale(d))
    .attr('y1', 0)
    .attr('y2', height);
  chart
    .selectAll('g.discovery-mark')
    .append('text')
    .attr('opacity', 0)
    .attr('transform', (d) => `translate(${xScale(d)}, 50) rotate(-90)`)
    .text((_, i) => (i === 0 ? 'Recorded M1' : 'Recorded M110'))
    .attr('dy', -5)
    .attr('font-size', 12)
    .attr('text-anchor', 'end')
    .transition()
    .delay(6000)
    .attr('opacity', 1);
}

function parseDiscovDate(d) {
  return parse(d, 'uuuu MMM dd', new Date());
}
