document.addEventListener('astro:page-load', () => {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (typeof maplibregl === 'undefined') {
    mapEl.innerHTML =
      '<div style="padding: 2rem; text-align: center; color: var(--sepia)">Loading map library...</div>';
    setTimeout(() => {
      if (typeof maplibregl !== 'undefined') {
        initMap();
      } else {
        mapEl.innerHTML =
          '<div style="padding: 2rem; text-align: center; color: var(--sepia)">Failed to load map. Please refresh.</div>';
      }
    }, 2000);
    return;
  }

  initMap();

  function initMap() {
    mapEl.innerHTML = '';
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [121.0489, 14.5986], // Longitude, Latitude
      zoom: 15,
      scrollZoom: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
      }),
      'top-right'
    );

    const popup = new maplibregl.Popup({
      offset: 35,
      closeButton: false,
    }).setHTML(
      '<div style="font-family: \'Libre Franklin\', sans-serif; color: #111; font-size: 13px; line-height: 1.4;"><strong style="font-family: \'Cormorant Garamond\', serif; font-size: 16px; display: block; margin-bottom: 4px;">San Anselmo Publications</strong>Grace Building, Ortigas Ave,<br>Greenhills, San Juan City</div>'
    );

    new maplibregl.Marker({ color: '#8C3D1F' })
      .setLngLat([121.0489, 14.5986])
      .setPopup(popup)
      .addTo(map);

    popup.setLngLat([121.0489, 14.5986]).addTo(map);

    map.on('load', () => {
      map.resize();
    });
  }
});
