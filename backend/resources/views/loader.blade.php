<div id="page-loader" class="loader-overlay" role="alert" aria-busy="true" aria-live="polite">
  <div class="loader" aria-hidden="true"></div>
  <span class="loader-text">Loading...</span>
</div>

<style>
  :root{
    --loader-size:72px;
    --loader-thickness:6px;
    --loader-color:#1a2c50;
    --loader-muted:#e6e9ef;
  }

  /* Spinner */
  .loader{
    width:var(--loader-size);
    height:var(--loader-size);
    border-radius:50%;
    border:var(--loader-thickness) solid var(--loader-muted);
    border-top-color:var(--loader-color);
    animation:spin .8s linear infinite;
  }
  .loader-text{
    margin-top:.5rem;
    font:500 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
    letter-spacing:.06em;
    color:var(--loader-color);
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Full-page overlay */
  .loader-overlay{
    position:fixed;
    inset:0;
    display:grid;
    place-items:center;
    gap:.75rem;
    background:#fff;
    z-index:9999;
    opacity:1;
    transition:opacity .25s ease;
  }
  .loader-overlay.is-done{ opacity:0; pointer-events:none; }
</style>

<script>
  // Fade the overlay out when the page has fully loaded
  window.addEventListener('load', () => {
    const overlay = document.getElementById('page-loader');
    overlay.classList.add('is-done');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once:true });
  });
</script>
