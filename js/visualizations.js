// En visualizations.js

// Actualizar todas las visualizaciones
function updateVisualizations() {
    createPipelineVisualization();
    createEmploymentTypeChart();
    createDescriptionLengthChart();
    createGeoDistributionMap();
    createRequirementsChart();
    createFraudByIndustryChart();
    createTemporalTrendsChart();
    createRequirementsRadarChart()
}

// 1. Visualización de Pipeline
function createPipelineVisualization() {
    const container = d3.select("#pipeline-viz");
    container.selectAll("*").remove();
    
    const width = container.node().getBoundingClientRect().width;
    const height = 150;
    const margin = {top: 20, right: 20, bottom: 30, left: 20};
    
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Datos para el pipeline (ejemplo)
    const pipelineData = [
        {stage: "Total", value: filteredData.length, color: "#3498db"},
        {stage: "Fraudulentas", value: d3.sum(filteredData, d => d.fraudulent), color: "#e74c3c"},
        {stage: "Reales", value: filteredData.length - d3.sum(filteredData, d => d.fraudulent), color: "#2ecc71"},
        {stage: "Analizadas", value: filteredData.length, color: "#f39c12"}
    ];
    
    const x = d3.scaleLinear()
        .domain([0, d3.max(pipelineData, d => d.value)])
        .range([margin.left, width - margin.right]);
    
    // Crear barras del pipeline
    svg.selectAll(".pipeline-bar")
        .data(pipelineData)
        .enter()
        .append("rect")
        .attr("class", "pipeline-bar")
        .attr("x", margin.left)
        .attr("y", (d, i) => margin.top + i * 25)
        .attr("width", d => x(d.value) - margin.left)
        .attr("height", 20)
        .attr("fill", d => d.color)
        .attr("rx", 3)
        .attr("ry", 3);
    
    // Etiquetas de las barras
    svg.selectAll(".pipeline-label")
        .data(pipelineData)
        .enter()
        .append("text")
        .attr("class", "pipeline-label")
        .attr("x", margin.left + 5)
        .attr("y", (d, i) => margin.top + i * 25 + 15)
        .text(d => `${d.stage}: ${d.value}`)
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "bold");
}

// 2. Gráfico de Tipo de Empleo vs. Fraude
function createEmploymentTypeChart() {
    const container = d3.select("#employmentTypeChart");
    container.selectAll("*").remove();
    
    const width = container.node().getBoundingClientRect().width;
    const height = 300;
    const margin = {top: 40, right: 30, bottom: 60, left: 60};
    
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Procesar datos
    const typeData = d3.rollup(filteredData, 
        v => ({
            total: v.length,
            fraudulent: d3.sum(v, d => d.fraudulent),
            ratio: d3.sum(v, d => d.fraudulent) / v.length
        }),
        d => d.employment_type
    );
    
    const typeArray = Array.from(typeData, ([key, value]) => ({type: key, ...value}))
        .sort((a, b) => b.ratio - a.ratio);
    
    // Escalas
    const x = d3.scaleBand()
        .domain(typeArray.map(d => d.type))
        .range([0, width - margin.left - margin.right])
        .padding(0.2);
        
    const y = d3.scaleLinear()
        .domain([0, d3.max(typeArray, d => d.ratio)])
        .range([height - margin.top - margin.bottom, 0]);
    
    // Barras
    svg.selectAll(".bar")
        .data(typeArray)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.ratio))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.top - margin.bottom - y(d.ratio))
        .attr("fill", d => d.ratio > 0.1 ? "#e74c3c" : "#2ecc71")
        .on("mouseover", function(event, d) {
            showTooltip(event, `
                <strong>${d.type || "No especificado"}</strong><br>
                Total: ${d.total} ofertas<br>
                Fraudulentas: ${d.fraudulent}<br>
                Tasa: ${(d.ratio * 100).toFixed(1)}%
            `);
        })
        .on("mouseout", hideTooltip);
    
    // Ejes
    svg.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x));
        
    svg.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(y).ticks(5, "%"));
    
    // Títulos
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .text("Tasa de Fraude por Tipo de Empleo");
}

function createDescriptionLengthChart() {
    const container = d3.select("#descriptionLengthChart");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width || 800;
    const margin = {top: 40, right: 30, bottom: 60, left: 60};
    const height = 300 - margin.top - margin.bottom;

    // Usar filteredData igual que createEmploymentTypeChart
    const data = filteredData;

    // Procesar datos: calcular longitud de descripción
    data.forEach(d => {
        d.descriptionLength = d.description ? d.description.length : 0;
    });

    // SVG
    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.descriptionLength)])
        .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    // Datos para la línea de tendencia (fraude por longitud)
    const binSize = 100;
    const bins = d3.range(0, d3.max(data, d => d.descriptionLength) + binSize, binSize);

    const binnedData = bins.map(bin => {
        const lower = bin;
        const upper = bin + binSize;
        const inBin = data.filter(d => d.descriptionLength >= lower && d.descriptionLength < upper);
        const total = inBin.length;
        const fraudulent = d3.sum(inBin, d => d.fraudulent);

        return {
            bin: bin,
            total: total,
            fraudulent: fraudulent,
            ratio: total > 0 ? fraudulent / total : 0
        };
    }).filter(d => d.total > 0);

    // Línea de tendencia
    const line = d3.line()
        .x(d => x(d.bin + binSize/2))
        .y(d => y(d.ratio));

    svg.append("path")
        .datum(binnedData)
        .attr("class", "trend-line")
        .attr("d", line)
        .attr("stroke", "#ff6b6b")
        .attr("stroke-width", 3)
        .attr("fill", "none");

    // Histograma
    const histogram = d3.histogram()
        .value(d => d.descriptionLength)
        .domain(x.domain())
        .thresholds(bins);

    const bins2 = histogram(data);

    svg.selectAll("rect")
        .data(bins2)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length / d3.max(bins2, d => d.length)))
        .attr("width", d => x(d.x1) - x(d.x0) - 1)
        .attr("height", d => height - y(d.length / d3.max(bins2, d => d.length)))
        .attr("fill", "#4ecdc4")
        .attr("opacity", 0.6)
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    // Ejes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5, "%"));

    // Títulos
    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Longitud de Descripción vs. Tasa de Fraude");

    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Longitud de la Descripción (caracteres)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Tasa de Fraude / Densidad");

    // Leyenda
    const legend = svg.append("g")
        .attr("transform", `translate(${(width - margin.left - margin.right) - 150},20)`);

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#ff6b6b");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text("Tasa de Fraude")
        .style("font-size", "12px");

    legend.append("rect")
        .attr("y", 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#4ecdc4")
        .attr("opacity", 0.6);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .text("Distribución de Longitudes")
        .style("font-size", "12px");

    function showTooltip(event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.classed("hidden", false)
            .html(`
                <strong>Longitud: ${d.x0}-${d.x1} caracteres</strong><br>
                Total ofertas: ${d.length}<br>
                Fraudulentas: ${d3.sum(d, d => d.fraudulent)}<br>
                Porcentaje: ${(d3.sum(d, d => d.fraudulent) / d.length * 100).toFixed(1)}%
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        d3.select("#tooltip").classed("hidden", true);
    }
}

// Función para obtener las coordenadas de una ubicación usando OpenCage API
function getCoordinates(location) {
    const apiKey = 'c3c997706b4247bab60f472b86aaca61';  // Sustituye con tu API Key de OpenCage
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const firstResult = data.results[0];
                return {
                    lat: firstResult.geometry.lat,
                    lng: firstResult.geometry.lng
                };
            } else {
                return null;  // Si no se encuentra la ubicación
            }
        })
        .catch(error => {
            console.error('Error al obtener coordenadas:', error);
            return null;
        });
}

function createGeoDistributionMap() {
    const container = d3.select("#geoDistributionMap");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width || 800;
    const height = 300;

    // Usar filteredData igual que createDescriptionLengthChart
    const data = filteredData;

    // Procesar datos: agrupar por ubicación
    const locationData = d3.rollup(data, 
        v => ({
            total: v.length,
            fraudulent: d3.sum(v, d => d.fraudulent),
            ratio: d3.sum(v, d => d.fraudulent) / v.length
        }),
        d => d.location
    );

    // Convertir a array y limpiar datos
    const locationArray = Array.from(locationData, ([key, value]) => ({
        location: key,
        ...value
    })).filter(d => d.location && d.location.trim() !== "");

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(geojson) {
        const projection = d3.geoMercator()
            .fitSize([width, height], geojson);

        const path = d3.geoPath().projection(projection);

        // SVG con grupo para zoom
        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svg.append("g");

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Dibujar países
        g.append("g")
            .selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#dddddd")
            .attr("stroke", "#ffffff");

        // Agregar puntos para ubicaciones (simplificado)
        // En una implementación real, necesitarías geocodificar las ubicaciones
        // Esto es un ejemplo simplificado
        locationArray.forEach(d => {
            // En una implementación real, usarías un servicio de geocodificación
            // Aquí asignamos posiciones aleatorias como ejemplo
            const randomX = Math.random() * width;
            const randomY = Math.random() * height;
            
            svg.append("circle")
                .attr("cx", randomX)
                .attr("cy", randomY)
                .attr("r", Math.sqrt(d.total) / 2)
                .attr("fill", d.ratio > 0.1 ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 0, 255, 0.5)")
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5)
                .on("mouseover", function(event) {
                    d3.select("#tooltip").classed("hidden", false)
                        .html(`
                            <strong>${d.location}</strong><br>
                            Total ofertas: ${d.total}<br>
                            Fraudulentas: ${d.fraudulent}<br>
                            Tasa: ${(d.ratio * 100).toFixed(1)}%
                        `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select("#tooltip").classed("hidden", true);
                });
        });

        // Título
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .text("Distribución Geográfica de Ofertas Fraudulentas");

        // Leyenda
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 150},50)`);

        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 5)
            .attr("fill", "rgba(255, 0, 0, 0.5)");

        legend.append("text")
            .attr("x", 25)
            .attr("y", 15)
            .text("Alta tasa de fraude (>10%)")
            .style("font-size", "12px");

        legend.append("circle")
            .attr("cx", 10)
            .attr("cy", 30)
            .attr("r", 5)
            .attr("fill", "rgba(0, 0, 255, 0.5)");

        legend.append("text")
            .attr("x", 25)
            .attr("y", 35)
            .text("Baja tasa de fraude")
            .style("font-size", "12px");
    });
}

function createRequirementsChart() {
    const container = d3.select("#requirementsChart");
    container.selectAll("*").remove();

    const margin = {top: 40, right: 30, bottom: 60, left: 60};
    const width = container.node().getBoundingClientRect().width || 800;
    const height = 300 - margin.top - margin.bottom;

    // Usar filteredData igual que las otras funciones
    const data = filteredData;

    // Procesar datos: contar presencia de requisitos clave
    const requirements = ["experience", "education", "skills", "requirements"];
    const reqData = requirements.map(req => {
        const withReq = data.filter(d => d[req] && d[req].trim() !== "");
        const withoutReq = data.filter(d => !d[req] || d[req].trim() === "");

        return {
            requirement: req,
            withReq: {
                total: withReq.length,
                fraudulent: d3.sum(withReq, d => d.fraudulent),
                ratio: withReq.length > 0 ? d3.sum(withReq, d => d.fraudulent) / withReq.length : 0
            },
            withoutReq: {
                total: withoutReq.length,
                fraudulent: d3.sum(withoutReq, d => d.fraudulent),
                ratio: withoutReq.length > 0 ? d3.sum(withoutReq, d => d.fraudulent) / withoutReq.length : 0
            }
        };
    });

    // SVG
    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x0 = d3.scaleBand()
        .domain(requirements)
        .range([0, width - margin.left - margin.right])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(["with", "without"])
        .range([0, x0.bandwidth()])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(reqData, d => Math.max(d.withReq.ratio, d.withoutReq.ratio))])
        .range([height, 0]);

    // Barras agrupadas
    svg.append("g")
        .selectAll("g")
        .data(reqData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.requirement)},0)`)
        .selectAll("rect")
        .data(d => [
            {type: "with", value: d.withReq.ratio, count: d.withReq.total, requirement: d.requirement},
            {type: "without", value: d.withoutReq.ratio, count: d.withoutReq.total, requirement: d.requirement}
        ])
        .enter()
        .append("rect")
        .attr("x", d => x1(d.type))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => d.type === "with" ? "#4ecdc4" : "#ff6b6b")
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    // Ejes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5, "%"));

    // Títulos
    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Presencia de Requisitos vs. Tasa de Fraude");

    svg.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Tipo de Requisito");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Tasa de Fraude");

    // Leyenda
    const legend = svg.append("g")
        .attr("transform", `translate(${(width - margin.left - margin.right) - 150},20)`);

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#4ecdc4");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text("Con requisito")
        .style("font-size", "12px");

    legend.append("rect")
        .attr("y", 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#ff6b6b");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .text("Sin requisito")
        .style("font-size", "12px");

    function showTooltip(event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.classed("hidden", false)
            .html(`
                <strong>${d.type === "with" ? "Con" : "Sin"} ${d.requirement}</strong><br>
                Total ofertas: ${d.count}<br>
                Fraudulentas: ${Math.round(d.value * d.count)}<br>
                Tasa: ${(d.value * 100).toFixed(1)}%
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        d3.select("#tooltip").classed("hidden", true);
    }
}

function createFraudByIndustryChart() {
    const container = d3.select("#fraudByIndustry");
    container.selectAll("*").remove();

    const margin = {top: 40, right: 150, bottom: 60, left: 60};
    const width = container.node().getBoundingClientRect().width - 100 || 800;
    const height = 400 - margin.top - margin.bottom;

    // Usar filteredData igual que las otras funciones
    const data = filteredData;

    // Procesar datos: agrupar por industria
    const industryData = d3.rollup(data, 
        v => ({
            total: v.length,
            fraudulent: d3.sum(v, d => d.fraudulent),
            ratio: d3.sum(v, d => d.fraudulent) / v.length
        }),
        d => d.industry
    );

    // Convertir a array, filtrar industrias con suficientes datos y tomar top 10
    const industryArray = Array.from(industryData, ([key, value]) => ({
        industry: key || "No especificado",
        ...value
    }))
    .filter(d => d.total > 10) // Solo industrias con al menos 10 ofertas
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 20); // Top 10

    // SVG
    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleLinear()
        .domain([0, d3.max(industryArray, d => d.ratio)])
        .range([0, width]);
        
    const y = d3.scaleBand()
        .domain(industryArray.map(d => d.industry))
        .range([0, height])
        .padding(0.2);

    // Barras
    svg.selectAll(".bar")
        .data(industryArray)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.industry))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d.ratio))
        .attr("fill", d => d.ratio > 0.1 ? "#ff6b6b" : "#4ecdc4")
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    // Ejes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5, "%"));
        
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Títulos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Top 20 Tasa de Fraude por Industria (solo industrias con >10 ofertas)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Tasa de Fraude");

    // Agregar valores a las barras
    svg.selectAll(".bar-label")
        .data(industryArray)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.ratio) + 5)
        .attr("y", d => y(d.industry) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => `${(d.ratio * 100).toFixed(1)}%`)
        .style("font-size", "10px")
        .style("fill", "#333");

    function showTooltip(event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip.classed("hidden", false)
            .html(`
                <strong>${d.industry}</strong><br>
                Total ofertas: ${d.total}<br>
                Fraudulentas: ${d.fraudulent}<br>
                Tasa: ${(d.ratio * 100).toFixed(1)}%
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        d3.select("#tooltip").classed("hidden", true);
    }
}
// 7. Gráfico de Tendencias Temporales (Barras Apiladas: Total vs Fraudulentas)
function createTemporalTrendsChart() {
    const container = d3.select("#temporalTrendsChart");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = 300;
    const margin = {top: 40, right: 30, bottom: 60, left: 60};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Procesar datos por año
    const yearData = d3.rollup(filteredData, 
        v => ({
            total: v.length,
            fraudulent: d3.sum(v, d => d.fraudulent)
        }),
        d => d.year
    );

    const yearArray = Array.from(yearData, ([key, value]) => ({
        year: key,
        total: value.total,
        fraudulent: value.fraudulent,
        real: value.total - value.fraudulent
    })).sort((a, b) => a.year - b.year);

    // Escalas
    const x = d3.scaleBand()
        .domain(yearArray.map(d => d.year))
        .range([0, width - margin.left - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yearArray, d => d.total)])
        .range([height - margin.top - margin.bottom, 0]);

    // Barras apiladas
    svg.selectAll(".bar-total")
        .data(yearArray)
        .enter()
        .append("rect")
        .attr("class", "bar-real")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.real))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.real))
        .attr("fill", "#2ecc71")
        .on("mouseover", function(event, d) {
            showTooltip(event, `
                <strong>Año ${d.year}</strong><br>
                Ofertas reales: ${d.real}
            `);
        })
        .on("mouseout", hideTooltip);

    svg.selectAll(".bar-fraud")
        .data(yearArray)
        .enter()
        .append("rect")
        .attr("class", "bar-fraud")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.real + d.fraudulent))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.fraudulent))
        .attr("fill", "#e74c3c")
        .on("mouseover", function(event, d) {
            showTooltip(event, `
                <strong>Año ${d.year}</strong><br>
                Ofertas fraudulentas: ${d.fraudulent}
            `);
        })
        .on("mouseout", hideTooltip);

    // Ejes
    svg.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(y));

    // Títulos
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .text("Ofertas Totales y Fraudulentas por Año");

    // Leyenda
    const legend = svg.append("g")
        .attr("transform", `translate(${(width - margin.left - margin.right) - 150},10)`);

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#e74c3c");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text("Fraudulentas")
        .style("font-size", "12px");

    legend.append("rect")
        .attr("y", 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#2ecc71");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .text("Reales")
        .style("font-size", "12px");
}

// Funciones de tooltip
function showTooltip(event, content) {
    const tooltip = d3.select("#tooltip");
    tooltip.classed("hidden", false)
        .html(content)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").classed("hidden", true);
}
//8. Gráfico de Radar de Requisitos
function createRequirementsRadarChart() {
    const container = d3.select("#requirementsRadarChart");
    container.selectAll("*").remove();

    const width = container.node().getBoundingClientRect().width;
    const height = 450;
    const margin = {top: 100, right: 60, bottom: 60, left: 60};
    const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right, margin.bottom, margin.left);

    // Procesar datos
    const realJobs = filteredData.filter(d => !d.fraudulent);
    const fraudJobs = filteredData.filter(d => d.fraudulent);

    // Métricas de especificidad (ejemplo - adaptar según tus campos reales)
    const metrics = [
        {name: "Perfil de Compañia", real: calculateSpecificity(realJobs, "company_profile"), fraud: calculateSpecificity(fraudJobs, "required_education")},
        {name: "Experiencia", real: calculateSpecificity(realJobs, "required_experience"), fraud: calculateSpecificity(fraudJobs, "required_experience")},
        {name: "Beneficios", real: calculateSpecificity(realJobs, "benefits"), fraud: calculateSpecificity(fraudJobs, "skills")},
        {name: "Requisitos", real: calculateSpecificity(realJobs, "requirements"), fraud: calculateSpecificity(fraudJobs, "requirements")},
        {name: "Descripcion", real: d3.mean(realJobs, d => d.descriptionLength)/1000 || 0, fraud: d3.mean(fraudJobs, d => d.descriptionLength)/1000 || 0}
    ];

    // Escala radial
    const rScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);

    // Ángulo para cada eje
    const angleSlice = Math.PI * 2 / metrics.length;

    // SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    // Ejes radiales
    const axis = svg.append("g")
        .attr("class", "axis");

    axis.selectAll(".axis-line")
        .data(metrics)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d,i) => Math.cos(angleSlice*i - Math.PI/2) * radius)
        .attr("y2", (d,i) => Math.sin(angleSlice*i - Math.PI/2) * radius)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1);

    // Etiquetas de ejes
    axis.selectAll(".axis-label")
        .data(metrics)
        .enter()
        .append("text")
        .attr("class", "axis-label")
        .attr("x", (d,i) => Math.cos(angleSlice*i - Math.PI/2) * (radius + 20))
        .attr("y", (d,i) => Math.sin(angleSlice*i - Math.PI/2) * (radius + 20))
        .text(d => d.name)
        .style("font-size", "12px")
        .style("text-anchor", "middle");

    // Círculos concéntricos
    const circles = [0.2, 0.4, 0.6, 0.8, 1];
    
    svg.append("g")
        .selectAll(".grid-circle")
        .data(circles)
        .enter()
        .append("circle")
        .attr("class", "grid-circle")
        .attr("r", d => radius * d)
        .attr("fill", "none")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.5);

    // Datos para las áreas
    const realArea = metrics.map((d,i) => ({
        x: Math.cos(angleSlice*i - Math.PI/2) * rScale(d.real),
        y: Math.sin(angleSlice*i - Math.PI/2) * rScale(d.real)
    }));

    const fraudArea = metrics.map((d,i) => ({
        x: Math.cos(angleSlice*i - Math.PI/2) * rScale(d.fraud),
        y: Math.sin(angleSlice*i - Math.PI/2) * rScale(d.fraud)
    }));

    // Línea para ofertas reales
    const realLine = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinearClosed);

    svg.append("path")
        .datum(realArea)
        .attr("class", "radar-area")
        .attr("d", realLine)
        .attr("fill", "rgba(46, 204, 113, 0.4)")
        .attr("stroke", "#2ecc71")
        .attr("stroke-width", 2)
        .on("mouseover", function() {
            d3.select(this).attr("fill", "rgba(46, 204, 113, 0.7)");
            showTooltip(event, "<strong>Ofertas Reales</strong><br>Requisitos más específicos");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "rgba(46, 204, 113, 0.4)");
            hideTooltip();
        });

    // Línea para ofertas fraudulentas
    const fraudLine = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinearClosed);

    svg.append("path")
        .datum(fraudArea)
        .attr("class", "radar-area")
        .attr("d", fraudLine)
        .attr("fill", "rgba(231, 76, 60, 0.4)")
        .attr("stroke", "#e74c3c")
        .attr("stroke-width", 2)
        .on("mouseover", function() {
            d3.select(this).attr("fill", "rgba(231, 76, 60, 0.7)");
            showTooltip(event, "<strong>Ofertas Fraudulentas</strong><br>Requisitos menos específicos");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "rgba(231, 76, 60, 0.4)");
            hideTooltip();
        });

    // Puntos de datos
    svg.selectAll(".real-dot")
        .data(realArea)
        .enter()
        .append("circle")
        .attr("class", "radar-dot")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .attr("fill", "#2ecc71");

    svg.selectAll(".fraud-dot")
        .data(fraudArea)
        .enter()
        .append("circle")
        .attr("class", "radar-dot")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .attr("fill", "#e74c3c");

    // Leyenda
    const legend = svg.append("g")
        .attr("transform", `translate(${-width/2 + 40},${-height/2 + 30})`);

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#2ecc71");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text("Ofertas Reales")
        .style("font-size", "12px");

    legend.append("rect")
        .attr("y", 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#e74c3c");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .text("Ofertas Fraudulentas")
        .style("font-size", "12px");

    // Título
    svg.append("text")
        .attr("x", 0)
        .attr("y", -height/2 + 30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Especificidad de Requisitos: Reales vs. Fraudulentas");
}

// Función auxiliar para calcular especificidad (adaptar según tus datos)
function calculateSpecificity(data, field) {
    const validEntries = data.filter(d => d[field] && d[field].trim() !== "");
    if (validEntries.length === 0) return 0;
    
    // Métrica simple: longitud promedio del texto normalizada
    const avgLength = d3.mean(validEntries, d => d[field].length) / 100;
    return Math.min(avgLength, 1); // Normalizar a máximo 1
}