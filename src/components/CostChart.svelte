<script>
  import { onMount } from "svelte";
  import { formatCurrency } from "../lib/format.js";

  let { rows = [], highlightYear = null, onHoverYear, horizon = 0 } = $props();

  let canvas = $state(null);
  let chart = $state(null);
  let loadError = $state(false);

  const chartJsUrl = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
  let chartPromise;

  function loadChartJs() {
    if (typeof window !== "undefined" && window.Chart) {
      return Promise.resolve(window.Chart);
    }
    if (chartPromise) {
      return chartPromise;
    }
    chartPromise = new Promise((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("no-document"));
        return;
      }
      const script = document.createElement("script");
      script.src = chartJsUrl;
      script.async = true;
      script.onload = () => resolve(window.Chart);
      script.onerror = () => reject(new Error("chart-load-failed"));
      document.head.appendChild(script);
    });
    return chartPromise;
  }

  function buildData(dataRows) {
    return {
      labels: dataRows.map((row) => `Jahr ${row.year}`),
      datasets: [
        {
          label: "Jahreskosten",
          data: dataRows.map((row) => row.total),
          borderColor: "#b85d25",
          backgroundColor: "rgba(184, 93, 37, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: "Kumuliert",
          data: dataRows.map((row) => row.cumulative),
          borderColor: "#2f6d5a",
          backgroundColor: "rgba(47, 109, 90, 0.2)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    };
  }

  function buildOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatCurrency(value, 0)
          },
          grid: {
            color: "rgba(30, 41, 59, 0.08)"
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      onHover: (_event, elements) => {
        if (!onHoverYear) return;
        if (!elements || !elements.length) {
          onHoverYear(null);
          return;
        }
        const index = elements[0].index;
        const year = rows[index]?.year;
        onHoverYear(year ?? null);
      }
    };
  }

  function updateActiveYear(year) {
    if (!chart) return;
    if (!year) {
      chart.setActiveElements([]);
      if (chart.tooltip) {
        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
      }
      chart.update();
      return;
    }
    const index = rows.findIndex((row) => row.year === year);
    if (index === -1) return;
    const active = [
      { datasetIndex: 0, index },
      { datasetIndex: 1, index }
    ];
    chart.setActiveElements(active);
    const meta = chart.getDatasetMeta(1);
    const point = meta?.data?.[index];
    if (chart.tooltip && point) {
      chart.tooltip.setActiveElements(active, { x: point.x, y: point.y });
    }
    chart.update();
  }

  function updateChartData() {
    if (!chart) return;
    chart.data = buildData(rows);
    chart.options = buildOptions();
    chart.update();
  }

  onMount(async () => {
    try {
      const Chart = await loadChartJs();
      if (!canvas || !Chart) return;
      chart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: buildData(rows),
        options: buildOptions()
      });
    } catch (error) {
      loadError = true;
    }

    return () => {
      chart?.destroy();
    };
  });

  $effect(() => {
    rows;
    horizon;
    if (chart) {
      updateChartData();
    }
  });

  $effect(() => {
    highlightYear;
    updateActiveYear(highlightYear);
  });
</script>

<div class="chart-shell">
  {#if loadError}
    <div class="chart-error">
      Chart konnte nicht geladen werden. Bitte Internetverbindung prüfen.
    </div>
  {:else}
    <canvas
      bind:this={canvas}
      aria-label="Kostenverlauf"
      onmouseleave={() => onHoverYear && onHoverYear(null)}
    ></canvas>
  {/if}
</div>
