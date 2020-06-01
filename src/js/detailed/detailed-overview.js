function SelectedDocumentsOverview(FEATURE_ID, documentComparisonData, collectedDocuments){

    this.visualizeOverview = () => {
        const SVG_HEIGHT = 960;
        const SVG_WIDTH = 960;
        const CIRCLE_PADDING = 3;
        const MARGIN = 20;
        const DIAMETER = SVG_HEIGHT;



        let svg = d3.select('#overview-svg'),
            g = svg.append("g")
                .attr("transform", "translate(" + DIAMETER / 2  + "," + DIAMETER / 2 + ")");

        let color = d3.scaleLinear()
            .domain([-1, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl);

        //create the parent container
        let boundingBox = d3.pack().size([SVG_WIDTH - MARGIN, SVG_HEIGHT- MARGIN]).padding(CIRCLE_PADDING);

        //returns either 0 or 1
        let randomBoolean = () => {
            return Math.round(Math.random());
        };

        //returns a value between 1 and max
        let getRandomValue = (max) => {
            return Math.ceil(Math.random() * max);
        };

        //set up randomization of the leaf nodes
        let randomizeChildren = (...algorithms) => {
            let children = [];
            let selectedAlgorithms = algorithms.filter(() => {
                return randomBoolean()
            });

            selectedAlgorithms.forEach((algorithmName) => {
                children.push({"name": algorithmName, size: getRandomValue(25)})
            });

            return children;
        };

        // allow the retrieval of different randomized data for each document
        let getDocumentOverviewData = (value) => {
            return [
                {
                    "name": "Citation",
                    "children": randomizeChildren("cc", "bc", "gct", "lccs", "lccsdist"),
                    "size": value
                },
                {
                    "name": "Math",
                    "children": randomizeChildren("histo", "lics", "git", "mathsim"),
                    "size": value
                },
                {
                    "name": "Figures",
                    children: randomizeChildren("iplag", "madeUpAlgo1", "madeUpAlgo2", "madeUpAlog3"),
                    "size": value
                },
                {
                    "name": "Text",
                    "children": randomizeChildren("sher", "enco", "bsm", "mySuperTextAlgo"),
                    "size": value
                }]
        };

        let overviewData = {};

        //instantiate the root element
        overviewData.name = "root";
        overviewData.children = [];

        // create randomized data for each collected document
        collectedDocuments.forEach((document, index) => {
            overviewData.children.push({name: document.title, children: getDocumentOverviewData(25), "size": index + 1});
        });

        let root = d3.hierarchy(overviewData)
            .sum(function (d) {
                return d.size;
            })
            .sort(function (a, b) {
                return b.value - a.value;
            });

        let focus = root,
            //this is where d3 does its magic and calculates necessary x, y and r coordinates for our data within the layout
            nodes = boundingBox(root).descendants(),
            view;

        let circle = g.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
                .attr("class", function (d) {
                    return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
                })
                .style("fill", function (d) {
                    return d.parent ? d.children ? color(d.depth) : "white" : "white"
                })
                .on("click", function (d) {
                    if (focus !== d) zoom(d), d3.event.stopPropagation();
                });


        let text = g.selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
                .attr("class", "overview-label")
                .style("fill-opacity", function (d) {
                    return d.parent === root ? 1 : 0;
                })
                .style("display", function (d) {
                    return d.parent === root ? "inline" : "none";
                })
                .text(function (d) {
                    return d.data.name;
                });


        let node = g.selectAll("circle,text");

        svg
            .style("background", "white")
            .on("click", function () {
                zoom(root);
            });

        //zoom to the part where our content has been placed
        zoomTo([root.x, root.y, root.r * 2 + MARGIN]);

        //handles the zoom
        function zoom(d) {
            let focus0 = focus;
            focus = d;

            let transition = d3.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween("zoom", function (d) {
                    let i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + MARGIN]);
                    return function (t) {
                        zoomTo(i(t));
                    };
                });

            transition.selectAll("text")
                .filter(function (d) {
                    return d.parent === focus || this.style.display === "inline";
                })
                .style("fill-opacity", function (d) {
                    return d.parent === focus ? 1 : 0;
                })
                .on("start", function (d) {
                    if (d.parent === focus) this.style.display = "inline";
                })
                .on("end", function (d) {
                    if (d.parent !== focus) this.style.display = "none";
                });
        }

        function zoomTo(v) {
            let k = DIAMETER / v[2];
            view = v;
            node.attr("transform", function (d) {
                return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
            });
            circle.attr("r", function (d) {
                return d.r * k;
            });
        }
    };
}