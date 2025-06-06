// Inicializar los filtros
function initializeFilters() {
    // Obtener valores únicos para cada categoría de filtro
    const employmentTypes = [...new Set(globalData.map(d => d.employment_type))];
    const industries = [...new Set(globalData.map(d => d.industry))];
    const locations = [...new Set(globalData.map(d => d.location))];
    
    // Crear filtros para tipo de empleo
    createDropdownFilter("employment-type-filter", employmentTypes, "employment_type");
    
    // Crear filtros para industria
    createDropdownFilter("industry-filter", industries, "industry");
    
    // Crear filtros para ubicación
    createDropdownFilter("location-filter", locations, "location");
    
    // Crear filtro de rango de salario si existe el campo
    if (globalData.some(d => d.salary)) {
        createSalaryRangeFilter();
    }
}

function createDropdownFilter(containerId, options, filterKey) {
    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove();

    // Limpiar y ordenar opciones
    options = options.filter(option => option);
    options.sort();

    // Crear el select
    const select = container.append("select")
        .attr("class", "filter-dropdown")
        .attr("multiple", true)
        .style("width", "100%")
        .node();

    // Añadir opciones
    options.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.text = option;
        select.appendChild(opt);
    });

    // Inicializar Select2
    $(`#${containerId} select`).select2({
        placeholder: `${filterKey.replace('_', ' ')}`,
        width: '100%',
        closeOnSelect: false
    });

    // Evento change de Select2 para actualizar los filtros y aplicar
    $(`#${containerId} select`).on('change', function () {
        const selectedOptions = $(this).val() || [];
        filters[filterKey] = selectedOptions;
        applyFilters();
    });
}

// Crear filtro de rango de salario
function createSalaryRangeFilter() {
    const container = d3.select("#salary-filter");
    if (container.empty()) return;
    
    container.selectAll("*").remove();
    
    // Obtener valores de salario válidos
    const salaryData = globalData
        .filter(d => d.salary && !isNaN(d.salary))
        .map(d => +d.salary);
    
    if (salaryData.length === 0) return;
    
    const minSalary = d3.min(salaryData);
    const maxSalary = d3.max(salaryData);
    
    // Crear HTML para el rango
    container.append("h3").text("Rango de Salario");
    
    const rangeContainer = container.append("div")
        .attr("class", "salary-range-container");
    
    rangeContainer.append("div")
        .attr("class", "salary-values")
        .html(`
            <span id="min-salary-value">${formatSalary(minSalary)}</span>
            <span id="max-salary-value">${formatSalary(maxSalary)}</span>
        `);
    
    rangeContainer.append("div")
        .attr("class", "slider-container")
        .append("input")
        .attr("type", "range")
        .attr("id", "salary-range")
        .attr("min", 0)
        .attr("max", 200000)
        .attr("value", 200000)
        .attr("step", 100)
        .on("input", function() {
            const maxValue = this.value;
            d3.select("#max-salary-value").text(formatSalary(maxValue));
            filters.salaryMax = +maxValue;
            applyFilters();
        });
    
    // Inicializar valores del filtro
    filters.salaryMax = maxSalary;
}

function formatSalary(value) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Actualizar los filtros aplicados
function updateFilters(filterKey, value, isChecked) {
    if (isChecked) {
        if (!filters[filterKey].includes(value)) {
            filters[filterKey].push(value);
        }
    } else {
        filters[filterKey] = filters[filterKey].filter(item => item !== value);
    }
    
    // Aplicar filtros a los datos
    applyFilters();
}

// Aplicar todos los filtros a los datos
function applyFilters() {
    filteredData = globalData.filter(d => {
        // Verificar filtros de tipo de empleo
        if (filters.employment_type.length > 0 && !filters.employment_type.includes(d.employment_type)) {
            return false;
        }
        
        // Verificar filtros de industria
        if (filters.industry.length > 0 && !filters.industry.includes(d.industry)) {
            return false;
        }
        
        // Verificar filtros de ubicación
        if (filters.location.length > 0 && !filters.location.includes(d.location)) {
            return false;
        }
        
        // Verificar filtro de salario
        if (filters.salaryMax && d.salary && +d.salary > filters.salaryMax) {
            return false;
        }
        
        return true;
    });
    
    // Actualizar el dashboard con los datos filtrados
    updateDashboard();
}

// Actualizar los contadores en los filtros
function updateFilterCounts() {
    // Actualizar contadores para tipo de empleo
    updateDropdownCount("employment-type-filter", "employment_type");
    
    // Actualizar contadores para industria
    updateDropdownCount("industry-filter", "industry");
    
    // Actualizar contadores para ubicación
    updateDropdownCount("location-filter", "location");
    
    // Actualizar contador para salario (si existe)
    if (filters.salaryMax) {
        const count = filteredData.filter(d => d.salary && +d.salary <= filters.salaryMax).length;
        d3.select("#salary-count").text(`(${count})`);
    }
}

function updateDropdownCount(containerId, filterKey) {
    const select = document.getElementById(`${containerId}`).querySelector('select');
    if (!select) return;
    
    Array.from(select.options).forEach(option => {
        if (option.value) {
            const count = filteredData.filter(d => d[filterKey] === option.value).length;
            option.text = `${option.value} (${count})`;
        }
    });
    
    // Actualizar Select2 para reflejar los cambios
    $(`#${containerId} select`).trigger('change.select2');
}

// Reiniciar todos los filtros
function resetFilters() {
    filters = {
        employment_type: [],
        industry: [],
        location: [],
        salaryMax: null
    };
    
    // Reiniciar selects
    document.querySelectorAll('.filter-dropdown').forEach(select => {
        $(select).val(null).trigger('change');
    });
    
    // Reiniciar rango de salario
    if (document.getElementById('salary-range')) {
        const maxSalary = d3.max(globalData.filter(d => d.salary).map(d => +d.salary));
        document.getElementById('salary-range').value = maxSalary;
        d3.select("#max-salary-value").text(formatSalary(maxSalary));
        filters.salaryMax = maxSalary;
    }
    
    // Restaurar datos filtrados
    filteredData = [...globalData];
    
    // Actualizar dashboard
    updateDashboard();
}