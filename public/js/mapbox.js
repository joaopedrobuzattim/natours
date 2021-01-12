
    /* eslint-disable*/

    
    export const displayMap = locations=>{

        mapboxgl.accessToken = 'pk.eyJ1Ijoiam9hb3BlZHJvYnV6YXR0aSIsImEiOiJja2poNjk3ZzcxZW1lMzBwZG1jaW42aTh5In0.HdNK4WzI3ytH-r-BoWG_tg';
    
        var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/joaopedrobuzatti/ckjh74nxg0n2b19pf8tbqvyib',
        scrollZoom: false
        /* center: [-118.113491, 34.111745],
        zoom: 4 // Primeiro longitude depois latitude, */

        });

        const bounds = new mapboxgl.LngLatBounds(); //Area that will be displayed on the map
        
        locations.forEach(loc => {
            //Create marker
            const el = document.createElement('div');
            // Esta no estilo do Jonas
            el.className = 'marker';

            //Add new marker
            new mapboxgl.Marker({
                element: el,
                //parte de baixo do marcador aponta para a localização
                anchor: 'bottom'
            }).setLngLat(loc.coordinates).addTo(map)

            //Add popup
            new mapboxgl.Popup({
                offset: 30
            })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}</p>: ${loc.description}`)
            .addTo(map);

            //Extends map bounds to include current location
            bounds.extend(loc.coordinates)
        });

        map.fitBounds(bounds,{
            padding:{
                top: 200,
                bottom: 200,
                left: 100,
                right: 100
            }
        })



    }
        
    