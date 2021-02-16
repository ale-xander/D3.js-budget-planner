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

//arc path generator which makes the slice shapes. needs start and end angles
const arcPath = d3.arc()
                    .outerRadius(dims.radius)
                    .innerRadius(dims.radius / 2)


//update function
const update = (data) => {
    console.log(data)
}
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
});

update(data)