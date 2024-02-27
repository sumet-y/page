// TODO: Bonus: Make a hover over the bar and the whitespace to the right of it trigger the color change and tooltip so that a user browsing the bars doesn't end up on a blank space.
// Why does svg border thicken when viewport is resized smaller
// Why isn't the whole graph visible on landscape mobile?

// Aided by https://github.com/paradite/d3-cheatsheet

const width = 800;
const height = 600;
const padding = 20;

const yScale = d3.scaleLinear();
const xScale = d3.scaleTime();









fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json", {method: "GET", header: 'Content-Type: application/json'})
    .then((res) => res.json())
    .then((json) => {
        const data = json.data;
        
        const parsedData = data.map((element) => [generateDateObj(element[0]), element[1], element[0]])
       
        const barWidth = ((width - 2 * padding) / data.length) - .3 * ((width - 2 * padding) / data.length)
        
        c(barWidth + "lololol")
    
        const yMin = d3.min(parsedData, (d) => d[1]);
        const yMax = d3.max(parsedData, (d) => d[1]);
        yScale.domain([0, yMax]);
        yScale.range([height - padding, padding]);
        const yAxis = d3.axisLeft(yScale);
        
    
        const xMin = d3.min(parsedData, (d) => d[0].getTime());
        const xMax = d3.max(parsedData, (d) => d[0].getTime());
        
        xScale.domain([xMin, xMax]);
        xScale.range([0 + padding, width - padding])
        const xAxis = d3.axisBottom(xScale);
        xAxis.tickFormat((d) => new Date(d).getFullYear())
        
        c(yScale(yMax))
        c(xMax)
        c(xMin)
    
        c(new Date(xMax))
    
    

        let svgWrapper = 
            d3.select('#center-panel')
            .append('svg')
            .attr('id', 'svg-wrapper')
            // .attr('width', width)
            // .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('max-width', width + 'px')
    
    
        
        let tooltipTextX = '3';
    
        let timeoutId;
    
        svgWrapper
            .append('rect')
            .attr('fill-opacity', 0)
            .attr('width', width)
            .attr('height', height)
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('vector-effect', 'non-scaling-stroke')
    
        svgWrapper
            .selectAll('rect')
            .data(parsedData)
            .enter()
            .append('rect')
            .attr('data-date', (d) => d[2])
            .attr('data-gdp', (d) => d[1])
            .attr('x', (d, i) => xScale(d[0].getTime()) )
            .attr('y', (d, i) => yScale(d[1]))
            .attr('width', barWidth)
            .attr('height', (d) => height - padding - yScale(d[1]))
            .attr('class', 'bar')
            .on('mouseover', (e, d, i) => {
                timeoutId ? clearTimeout(timeoutId) : null;
            
            
                // Keep tooltip in svg view port
                if (xScale(d[0].getTime()) + 20 <= 672.44) {
                    tooltip
                        .style('visibility', 'visible')
                        .attr('transform', 'translate(' + (xScale(d[0].getTime()) + 20) + ', 500)')
                } else {
                    tooltip
                        .style('visibility', 'visible')
                        .attr('transform', 'translate(' + (xScale(d[0].getTime()) - 20 -125) + ', 500)')
                }
                
                tooltip.attr('data-date', d[2]);
                    
                tooltipText
                    .text(new Intl.DateTimeFormat('en-US', { month: 'long'}).format(d[0]) + " " + d[0].getDate() + ", " + d[0].getFullYear())
                    .append('tspan')
                    .text('$' + d[1] + ' billion')
                    .attr('dy', '24')
                    .attr('x', tooltipTextX)
                    
                    
            })
            .on('mouseout', (e, d, i) => {
                timeoutId = setTimeout(() => tooltip.style('visibility', 'hidden'), 500)
            })
            .on('click', (e, d, i) => {
                c(tooltip.attr('transform'))
            })
    
    
        let tooltip =
            svgWrapper.append('g')
            .attr('id', 'tooltip')
        
        let tooltipRect = tooltip
            .append('rect')
            .attr('height', 60)
            .attr('width', 125)
            .attr('rx', '.75%')
            .attr('ry', '.75%');
        
       
        let tooltipText = tooltip
            .append('text')
            .attr('x', tooltipTextX)
            .attr('y', 24);
    
    
    
    // Doesn't work with FCC's testing
            // .append('title')
            // .attr('data-date', (d) => d[0])
            // .text((d) => (new Intl.DateTimeFormat('en-US', { month: 'long'}).format(d[0]) + " " + d[0].getDate() + ", " + d[0].getFullYear()) + "\n" + d[1])
        
        svgWrapper
            .append("g")
            .attr('id', 'x-axis')
            .attr("transform", "translate(0, " + (height - padding) + ")")
            .call(xAxis)
    
        svgWrapper
            .append('g')
            .attr('id', 'y-axis')
            .attr("transform", "translate(" + padding + ", 0)")
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll(".tick text")
	        .attr("transform", "translate(45,0)")
        
        svgWrapper.select('.y-axis text:last-child')
            .attr('transform', 'translate(-10000,0)')
    
    // Graph title
    svgWrapper.append('text')
        .attr('id', 'title')
        .attr('x', width / 2)
        .attr('y', padding + 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '32px')
        .style('font-family', 'sans-serif')
        .text('United States GDP')
    
    svgWrapper.append('text')
        .attr('transform', `translate(${padding + 70}, ${padding + 230}) rotate(-90)`)
        .style('font-size', '16px')
        .style('font-family', 'sans-serif')
        .append('tspan')
        .text('Gross Domestic Product')
        .append('tspan')
        .text('(billions)')
        .attr('dy', '16px')
        .attr('dx', '-120px')
    
       
    
    
        
    
    
        
    
    
        c(svgWrapper)
    
})
    
    



// utility functions
function c(input) {
    console.log(input);
}


function generateDateObj(string) {
    

    year = parseInt(string.slice(0, 4));
    monthIndex = parseInt(string.slice(5, 7)) - 1;
    day = parseInt(string.slice(8));


    dateObj = new Date(year, monthIndex, day);

    return dateObj;
}