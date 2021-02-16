console.log('graph.js connected')

const dims = { height: 300, width: 300, radius: 150 };
const center = { x: (dims.width / 2 + 5), y: (dims.height / 2 + 5)};
// const t = d3.transition().duration(500)
// create svg container
const svg = d3.select('.canvas')
  .append('svg')
  .attr('width', dims.width + 150)
  .attr('height', dims.height + 150);

// translates the graph group to the middle of the svg container
const graph = svg.append('g')
  .attr("transform", `translate(${center.x}, ${center.y})`);

//retrun a func that generates angles. you get start and end angle for each
const pie = d3.pie()
                .sort(null) //don't re-sort my data based on size
                .value(d => d.cost) //generate angles based on cost from firestore
                

//arc path generator which makes the slice shapes. needs start and end angles
const arcPath = d3.arc()
  .outerRadius(dims.radius)
  .innerRadius(dims.radius / 2);

const color = d3.scaleOrdinal(d3['schemeSet2'])

//update function to pass thru pie and arc generator
const update = (data) => {
    //update color scale domain
    color.domain(data.map(item => item.name))

    // join enhanced (pie) data to path elements
    const paths = graph.selectAll('path')
      .data(pie(data));//get data with angles attached
  
    //remove deleted elements from chart
    paths.exit().remove()

    //update elements currently in DOM
    paths.attr('d', arcPath)
       
    //append selection to DOM
    paths.enter()
      .append('path')
        .attr('class', 'arc')
        // .attr('d', arcPath) don't need this anymore because of Tween
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('fill', item => color(item.data.name))
        .transition().duration(750)
        .attrTween('d', arcTweenEnter)
};

//firestore listener
let data = []
db.collection('expenses').onSnapshot(res => {
    res.docChanges().forEach(change => {
        const doc = {...change.doc.data(), id: change.doc.id}

        switch (change.type) {
            case 'added':
                data.push(doc)
                break;
            case 'modified':
                //cahnge doc in array if the id of the snapshot matches
                const index = data.findIndex(item => item.id == doc.id);
                data[index] = doc;
                break;
            case 'removed':
                //if true item remain in array, otherwise it's removed
                data = data.filter(item => item.id != doc.id)
                break;
            default:
                break;
        }
    })
    update(data)
});

// =================== TWEENS ===================
const arcTweenEnter = (data) => {
    //spit out a value between 0 and 1 every time you call it
    let i = d3.interpolate(data.endAngle, data.startAngle)
    //starts at endAngle
    return function(t){
        data.startAngle = i(t)
        return arcPath(data)
    }
}
