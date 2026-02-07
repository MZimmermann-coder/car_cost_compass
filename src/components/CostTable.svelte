<script>
  import { formatCurrency } from "../lib/format.js";

  let { rows } = $props();
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Jahr</th>
        <th>Kaufpreis</th>
        <th>Steuerliche Mehrbelastung</th>
        <th>Leasing</th>
        <th>Versicherung/Steuer</th>
        <th>Wartung/Reparatur</th>
        <th>Kraftstoff</th>
        <th>THG-Quote</th>
        <th>Wertverlust</th>
        <th>Opportunität</th>
        <th>Gesamt</th>
        <th>Kumuliert</th>
        <th>Restwert</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td>{row.year}</td>
          <td>{formatCurrency(row.kaufpreis)}</td>
          <td>{formatCurrency(row.steuerMehr)}</td>
          <td>{formatCurrency(row.leasing)}</td>
          <td>{formatCurrency(row.versicherungSteuer)}</td>
          <td>{formatCurrency(row.wartungReparatur)}</td>
          <td>{formatCurrency(row.kraftstoff)}</td>
          <td>{formatCurrency(row.thg)}</td>
          <td>{formatCurrency(row.wertverlust)}</td>
          <td>{formatCurrency(row.opportunitaet)}</td>
          <td>{formatCurrency(row.total)}</td>
          <td>{formatCurrency(row.cumulative)}</td>
          <td>{formatCurrency(row.restwert)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>


