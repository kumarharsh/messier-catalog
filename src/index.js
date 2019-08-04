import * as d3 from 'd3';
import './index.css';

import plotCometDiscoveries from './comets';
import plotSkyCatalog from './catalog';

async function init() {
  const catalogData = await d3.tsv('./src/db/messier.tsv');
  const cometsData = await d3.tsv('./src/db/comets.tsv');
  const catalogDiscoveries = await d3.tsv('./src/db/discoveries.tsv');
  const catalogComposite = catalogData.map((data, index) => ({
    ...data,
    discoveryDate: catalogDiscoveries[index].date,
    discoveryDateAccuracy: catalogDiscoveries[index].accuracy,
    selfDiscovered: catalogDiscoveries[index].discovered
  }));
  const catalogComposite1774 = catalogComposite.slice(0, 45);
  const state = {
    cometsPlotted: false,
    catalog1774Plotted: false,
    catalogFullPlotted: false,
    allowInteraction: false
  };

  const width = 800;
  const height = 500;

  const $cometsCtr = document.querySelector('#comets');
  const $catalog1774Ctr = document.querySelector('#catalog-1774');
  const $catalogCtr = document.querySelector('#full-catalog');
  const $unlockMsg = document.querySelector('#unlock-message');

  const intersectionHandler = function(entries) {
    entries.forEach((entry) => {
      if (
        entry.intersectionRatio > 0.5 ||
        entry.boundingClientRect.height > entry.rootBounds.height
      ) {
        if (entry.target === $cometsCtr && !state.cometsPlotted) {
          state.cometsPlotted = true;
          plotCometDiscoveries($cometsCtr, cometsData, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
        } else if (
          entry.target === $catalog1774Ctr &&
          !state.catalog1774Plotted
        ) {
          state.catalog1774Plotted = true;
          plotSkyCatalog($catalog1774Ctr, catalogComposite1774, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
        } else if (entry.target === $catalogCtr && !state.catalogFullPlotted) {
          state.catalogFullPlotted = true;
          state.allowInteraction = true;
          // unlock interactions for all older charts by re-rendering them
          plotSkyCatalog($catalogCtr, catalogComposite, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
          plotSkyCatalog($catalog1774Ctr, catalogComposite1774, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
          plotCometDiscoveries($cometsCtr, cometsData, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
        } else if (entry.target === $unlockMsg) {
          $unlockMsg.classList.add('show');
        }
      }
    });
  };

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.75
  };
  [$cometsCtr, $catalog1774Ctr, $catalogCtr, $unlockMsg].forEach((target) => {
    const observer = new IntersectionObserver(
      intersectionHandler,
      observerOptions
    );
    observer.observe(target);
  });

  plotCometDiscoveries($cometsCtr, cometsData, width, height, {
    renderData: false,
    allowInteraction: state.allowInteraction
  });
  plotSkyCatalog($catalog1774Ctr, catalogComposite1774, width, height, {
    renderData: false,
    allowInteraction: state.allowInteraction
  });
  plotSkyCatalog($catalogCtr, catalogComposite, width, height, {
    renderData: false,
    allowInteraction: state.allowInteraction
  });
}

document.body.onload = function() {
  init();
};
