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

//pick a color scheme
const color = d3.scaleOrdinal(d3['schemeSet2'])

//legend for the pie chart.   https://d3-legend.susielu.com/
const legendGroup = svg.append('g')
  .attr('transform', `translate(${dims.width + 40}, 10)`);
const legend = d3.legendColor()
  // .shape('square')
  .shape('path', d3.symbol().type(d3.symbolCircle)())
  .shapePadding(10)
  .scale(color)

// tool tip for item name, cost.     github.com/bumbeishvili/d3-v6-tip
const tip = d3
  .tip()
  .attr("class", "d3-tip card lol") // We add the d3-tip class instead of the tip class
  .html((event, d) => { // It's (event, d) instead of just (d) in v6
    let content = `<div class="name">${d.data.name}</div>`;
    content += `<div class="cost">$${d.data.cost}</div>`;
    content += `<div class="delete">Click slice to delete</div>`;
    return content;
  });
 graph.call(tip);


//update function to pass thru pie and arc generator
const update = (data) => {
    //update color scale domain
    color.domain(data.map(item => item.name))

    //update and call legend
    legendGroup.call(legend)
    legendGroup.selectAll('text').attr('fill', 'white')

    // join enhanced (pie) data to path elements
    const paths = graph.selectAll('path')
      .data(pie(data));//get data with angles attached
  
    //remove deleted elements from chart
    paths.exit()
            .transition().duration(750)
            .attrTween('d', arcTweenExit)
            .remove()

    //update elements currently in DOM
    paths.transition().duration(750)
    .attrTween("d", arcTweenUpdate);
       
    //append selection to DOM
    paths.enter()
      .append('path')
        .attr('class', 'arc')
        // .attr('d', arcPath) don't need this anymore because of Tween
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('fill', item => color(item.data.name))
        //.each allows you to perform a function on every single element
        .each(function(d){ this._current = d })// this refers to current path. _current is a made up property
        .transition().duration(750)
        .attrTween('d', arcTweenEnter)

    // add event listeners
    graph
    .selectAll("path")
    .on("mouseover", (event, d) => {
      tip.show(event, d);
      handleMouseOver(event, d);
    })
    .on("mouseout", (event, d) => {
      tip.hide();
      handleMouseOut(event, d);
    })
    .on("click", handleClick);
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


// =================== EVENT HANDLERS ===================
const handleMouseOver = (event, d) => {
  //console.log(event.currentTarget);
  d3.select(event.currentTarget)
  .transition('changeSliceFill')
  .duration(200)
  .attr("fill", "#fff");
};

const handleMouseOut = (event, d) => {
  //console.log(event.currentTarget);
  d3.select(event.currentTarget)
  .transition('changeSliceFill')
  .duration(200)
  .attr("fill", color(d.data.name));
};

const handleClick = (event, d) => {
  console.log(d.data.id);
  const id = d.data.id;
  db.collection("expenses").doc(id).delete();
};


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

const arcTweenExit = (data) => {
    let i = d3.interpolate(data.startAngle, data.endAngle)
    return function(t){
        data.startAngle = i(t)
        return arcPath(data)
    }
}

// use function keyword to allow use of 'this'
function arcTweenUpdate(data) {
    console.log(this._current, data);
    // interpolate between the two objects
    let i = d3.interpolate(this._current, data);
    // update the current prop with new updated data
    this._current = i(1);
  
    return function(t) {
      // i(t) returns a value of d (data object) which we pass to arcPath
      return arcPath(i(t));
    };
  };