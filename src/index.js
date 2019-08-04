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
  const catalogCompositeList1 = catalogComposite.slice(0, 45);
  const catalogCompositeList2 = catalogComposite.slice(45);
  const state = {
    cometsPlotted: false,
    catalogList1Plotted: false,
    catalogList2Plotted: false,
    catalogFullPlotted: false,
    allowInteraction: false
  };

  const width = 800;
  const height = 500;

  const $cometsCtr = document.querySelector('#comets');
  const $catalogList1 = document.querySelector('#catalog-list1');
  const $catalogList2 = document.querySelector('#catalog-list2');
  const $catalogCtr = document.querySelector('#full-catalog');
  const $unlockMsg = document.querySelector('#unlock-message');
  document
    .querySelectorAll('.milky-way-silhouette')
    .forEach((node) => node.classList.remove('hide'));
  const discoveryMarks = [
    catalogDiscoveries[0].date,
    catalogDiscoveries[catalogDiscoveries.length - 1].date
  ];

  const intersectionHandler = function(entries) {
    entries.forEach((entry) => {
      if (
        entry.intersectionRatio > 0.5 ||
        entry.boundingClientRect.height > entry.rootBounds.height
      ) {
        if (entry.target === $cometsCtr && !state.cometsPlotted) {
          state.cometsPlotted = true;
          plotCometDiscoveries(
            $cometsCtr,
            cometsData,
            discoveryMarks,
            width,
            height,
            {
              renderData: true,
              allowInteraction: state.allowInteraction
            }
          );
        } else if (
          entry.target === $catalogList1 &&
          !state.catalogList1Plotted
        ) {
          state.catalogList1Plotted = true;
          plotSkyCatalog($catalogList1, catalogCompositeList1, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
        } else if (
          entry.target === $catalogList2 &&
          !state.catalogList2Plotted
        ) {
          state.catalogList2Plotted = true;
          plotSkyCatalog($catalogList2, catalogCompositeList2, width, height, {
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
          plotSkyCatalog($catalogList1, catalogCompositeList1, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
          plotSkyCatalog($catalogList2, catalogCompositeList2, width, height, {
            renderData: true,
            allowInteraction: state.allowInteraction
          });
          plotCometDiscoveries(
            $cometsCtr,
            cometsData,
            discoveryMarks,
            width,
            height,
            {
              renderData: true,
              allowInteraction: state.allowInteraction
            }
          );
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
  [$cometsCtr, $catalogList1, $catalogList2, $catalogCtr, $unlockMsg].forEach((target) => {
    const observer = new IntersectionObserver(
      intersectionHandler,
      observerOptions
    );
    observer.observe(target);
  });

  plotCometDiscoveries($cometsCtr, cometsData, discoveryMarks, width, height, {
    renderData: false,
    allowInteraction: state.allowInteraction
  });
  plotSkyCatalog($catalogList1, catalogCompositeList1, width, height, {
    renderData: false,
    allowInteraction: state.allowInteraction
  });
  plotSkyCatalog($catalogList2, catalogCompositeList2, width, height, {
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
