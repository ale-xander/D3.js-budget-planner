console.log('graph.js connected')

const dims = {
    height:300,
    width: 300,
    radius: 150
}
const center = {
    x: (dims.width / 2 + 5),
    y: (dims.height / 2 + 5)
}

const svg = d3.select('.canvas')
            .append('svg')
            .attr('width', dims.width + 150)//leaving 150px for legend on the right
            .attr('height', dims.height + 150)

const graph = svg.append('g') //append group
                .attr('transform', `translate(${center.x}, ${center.y})`)

//retrun a func that generates angles. you get start and end angle for each
const pie = d3.pie()
                .sort(null) //don't re-sort my data based on size
                .value(d => d.cost) //generate angles based on cost from firestore

