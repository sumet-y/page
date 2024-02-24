/*Copyright (c) 2013-2016, Rob Schmuecker
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* The name Rob Schmuecker may not be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/


// Get JSON data
heighttreeJSON = d3.json("flare.json", function(error, treeData) {

    // คำนวณโหนดทั้งหมด, ความยาวฉลากสูงสุด
    var totalNodes = 0;
    var maxLabelLength = 0;
    // ตัวแปรสำหรับการลาก/วาง
    var selectedNode = null;
    var draggingNode = null;
    // ตัวแปรแพน
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px จากขอบจะเลื่อนเมื่อลาก
    // อื่น ๆ. ตัวแปร
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();


    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // กำหนดการฉายภาพแนวทแยง d3 เพื่อใช้งานโดยเส้นทางของโหนดในภายหลัง
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    // ฟังก์ชันตัวช่วยแบบเรียกซ้ำสำหรับดำเนินการตั้งค่าบางอย่างโดยการเดินผ่านโหนดทั้งหมด

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // เรียกใช้ฟังก์ชัน visit เพื่อสร้าง maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });


    // เรียงลำดับต้นไม้ตามชื่อโหนด
    /*---ปิดเรียงลูกตามชื่อ
    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }
    // เรียงลำดับต้นไม้ตั้งแต่แรกในกรณีที่ JSON ไม่เรียงลำดับ
    sortTree();
    */
    // สิ่งที่ต้องทำ: ฟังก์ชัน Pan สามารถนำไปใช้งานได้ดีขึ้น
    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

   // กำหนดฟังก์ชันการซูมสำหรับแผนผังที่ซูมได้

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // กำหนด ZoomListener ซึ่งเรียกใช้ฟังก์ชันซูมในเหตุการณ์ "ซูม" ที่ถูกจำกัดภายใน scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function(a, b) { // เลือกพาเรนต์และติดตามเส้นทาง
            if (a.id != draggingNode.id) return 1; // a ไม่ใช่องค์ประกอบที่ถูกโฮเวอร์ ให้ส่ง "a" ไปทางด้านหลัง
            else return -1; // a คือองค์ประกอบที่ถูกโฮเวอร์ นำ "a" ไปไว้ข้างหน้า
        });
        // หากโหนดมีลูก ให้ลบลิงก์และโหนดออก
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function(d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function(d) {
                    return d.id;
                }).filter(function(d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

        // remove parent link
        parentLink = tree.links(tree.nodes(draggingNode.parent));
        svgGroup.selectAll('path.link').filter(function(d, i) {
            if (d.target.id == draggingNode.id) {
                return true;
            }
            return false;
        }).remove();

        dragStarted = null;
    }

    // กำหนด baseSvg โดยแนบคลาสสำหรับจัดแต่งทรงผมและ ZoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height",viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);


    // กำหนด Drag Listener สำหรับพฤติกรรมการลาก/วางของโหนด
    dragListener = d3.behavior.drag()
        .on("dragstart", function(d) {
            if (d == root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
           // สิ่งสำคัญคือเราต้องระงับเหตุการณ์การวางเมาส์บนโหนดที่ถูกลาก มิฉะนั้นจะดูดซับเหตุการณ์การวางเมาส์โอเวอร์และโหนดที่ซ่อนอยู่จะไม่ตรวจพบ d3.select(this).attr('pointer-events', 'none');
        })
        .on("drag", function(d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }

            // รับพิกัดของ mouseEvent ที่สัมพันธ์กับคอนเทนเนอร์ svg เพื่อให้สามารถแพนได้
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }

            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            var node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function(d) {
            if (d == root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // ตอนนี้ลบองค์ประกอบออกจากพาเรนต์แล้วแทรกลงในองค์ประกอบลูกใหม่
                var index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
               // ตรวจสอบให้แน่ใจว่าโหนดที่กำลังเพิ่มถูกขยายเพื่อให้ผู้ใช้สามารถเห็นว่าโหนดที่เพิ่มนั้นถูกย้ายอย่างถูกต้อง
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // ตอนนี้เรียกคืนเหตุการณ์การวางเมาส์ ไม่เช่นนั้นเราจะไม่สามารถลากเป็นครั้งที่ 2 ได้
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            centerNode(draggingNode);
            draggingNode = null;
        }
    }

   // ฟังก์ชันตัวช่วยสำหรับการยุบและขยายโหนด

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };
    // ฟังก์ชั่นเพื่ออัพเดตตัวเชื่อมต่อชั่วคราวที่บ่งบอกถึงการลากสังกัด
    var updateTempConnector = function() {
        var data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // ต้องพลิกพิกัดแหล่งที่มาเนื่องจากเราทำสิ่งนี้กับตัวเชื่อมต่อที่มีอยู่ในแผนผังดั้งเดิม
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        var link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    /// ทำหน้าที่ไปที่โหนดตรงกลางเมื่อคลิก/วาง เพื่อให้โหนดไม่สูญหายเมื่อยุบ/เคลื่อนที่โดยมีลูกจำนวนมาก

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // สลับฟังก์ชั่นลูก (ยืดได้หดได้)

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }
    // สลับลูก ๆ เมื่อคลิก
    function click(d) {
        if (d3.event.defaultPrevented) return; // คลิกถูกระงับ
        d = toggleChildren(d);
        update(d);
        centerNode(d);
    }

    function update(source) {
        // คำนวณความสูงใหม่ ฟังก์ชันจะนับลูกทั้งหมดของโหนดรูท และตั้งค่าความสูงของต้นไม้ตามลำดับ
         // สิ่งนี้จะป้องกันไม่ให้เลย์เอาต์ดูแบนราบเมื่อโหนดใหม่ถูกทำให้มองเห็นได้หรือดูกระจัดกระจายเมื่อโหนดถูกลบออก
         // สิ่งนี้ทำให้เลย์เอาต์สอดคล้องกันมากขึ้น
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 25; // 25 pixels ต่อ line  
        tree = tree.size([newHeight, viewerWidth]);

        // คำนวณเค้าโครงต้นไม้ใหม่
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // กำหนดความกว้างระหว่างระดับตาม maxLabelLength
        nodes.forEach(function(d) {
            //d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px ระยะความลึก Auto
            // หรืออีกทางหนึ่งเพื่อรักษามาตราส่วนคงที่เราสามารถกำหนดความลึกคงที่ต่อระดับได้
            // ทำให้เป็นมาตรฐานสำหรับความลึกคงที่โดยใส่ความคิดเห็นไว้ด้านล่างบรรทัด
            // d.y = (d.depth * 500); //500px per level.
            d.y = (d.depth * 200); // ระยะความลึกกำหนดเอง
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

         // ป้อนโหนดใหม่ที่ตำแหน่งก่อนหน้าของพาเรนต์
        var nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);
            
        // โหนด Phantom เพื่อให้เราวางเมาส์โอเวอร์ในรัศมีรอบๆ
        /*---ปิดการลากวงกลมสีแดง
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // เปลี่ยนค่านี้เป็นศูนย์เพื่อซ่อนพื้นที่เป้าหมาย
            .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            */
        /*---ปิดการลากตำแหน่ง
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });
        */
        // funtion เปิด link
        /*
        nodeEnter.append('a')
            .attr('xlink:href', function(d) {
              return d.url;
            })
            .append("svg:text")
            .text(function(d) { return d.name; })
            //.on("click", function(d){ alert(d.url); })
            .style("fill-opacity", 1e-6); 
            เปิด link New Tab
            .on("click", function(d) {
            window.open(d.url, "Window","status=1,toolbar=1,width=500,height=300,resizable=yes");
            });
            */
       
        // Get the modal
        var modal = document.getElementById("myModal");
        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];
        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
        }
      
        nodeEnter.append("a")
            .attr('xlink:href', function(d) {
            //return d.url;
            })
            .append("svg:text")
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1e-6)
            .on("click", function(d) {
                modal.style.display = "block";
                var website = d.url;
                document.getElementById("modalIframe").src = website;
            });

        //  funtion show  title เมื่อเมาส์ชี้  
        nodeEnter.append("svg:title")
            .text(function(d) {
            return d.description;
            });

        // อัปเดตข้อความเพื่อแสดงว่าโหนดมีลูกหรือไม่
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });

        // เปลี่ยนการเติมวงกลมขึ้นอยู่กับว่ามีลูกและยุบลงหรือไม่
        node.select("circle.nodeCircle")
            .attr("r", 4.5)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // การเปลี่ยนโหนดไปยังตำแหน่งใหม่
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });
        
        // เฟดข้อความเข้ามา
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // การเปลี่ยนโหนดออกไปยังตำแหน่งใหม่ของพาเรนต์
        
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // ป้อนลิงก์ใหม่ที่ตำแหน่งก่อนหน้าของผู้ปกครอง
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // ลิงก์การเปลี่ยนแปลงไปยังตำแหน่งใหม่
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

       // การเปลี่ยนโหนดออกไปยังตำแหน่งใหม่ของพาเรนต์
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();
        // ซ่อนตำแหน่งเก่าไว้เพื่อการเปลี่ยนแปลง
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // ผนวกกลุ่มที่เก็บโหนดทั้งหมดและตัวฟังการซูมสามารถดำเนินการได้
    var svgGroup = baseSvg.append("g");

   // กำหนดราก
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // เลย์เอาต์ต้นไม้ตั้งแต่แรกและอยู่ตรงกลางที่รูทโหนด
    update(root);
    centerNode(root);
});
