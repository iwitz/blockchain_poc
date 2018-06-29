Array.prototype.unique = function() {
    var unique = [];
    for (var i = 0; i < this.length; i++) {
        if (unique.indexOf(this[i]) == -1) {
            unique.push(this[i]);
        }
    }
    return unique;
};
async function sendBAB(id_sender, id_receiver, amount){
    console.log(amount+" BAB from "+id_sender+" to "+id_receiver);
    $('#viring').show();
    $.post("/api/sendBAB", {
        id_user_from : id_sender,
        id_user_to : id_receiver,
        amount : amount
    }, function(result){
        $('#viring').hide();
        console.log('vla le résultat de la requete : ');
        console.log(result);
        return result;
    });
}
function shadeColor(color, percent) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}
const colors = [
    "#3B7A57",
    "#FFBF00",
    "#FF7E00",
    "#3B3B6D",
    "#391802",
    "#804040",
    "#D3AF37",
    "#34B334",
    "#FF8B00",]
$('document').ready(async function(){
    $('#holder, #viring').hide();
    $.get("api/getAllBABHolders", function(unprocessed_result){
      let result = processHoldersList(unprocessed_result);
        $('#loading').hide();
        $('#holders').show();
        const holders = result.map(e => {
            return {
                id_user : e.id_user,
                BABBalance : e.BABBalance,
                login : e.user_desc.login
            }
        });

        const distance = function(a, b){
            return Math.sqrt(Math.pow(a.x - b.x , 2) + Math.pow(a.y - b.y, 2));
        }
        const canvas = document.getElementById('holders')
        var context = canvas.getContext("2d");

        var Circle = function(cx, cy, r, label, color, BABBalance){
            this.cx = cx;
            this.cy = cy;
            this.r = r;
            this.color = color;
            this.dragging = false;
            this.dragDifference;
            this.intersecting;
            this.label = label
            this.BABBalance = BABBalance

            this.getColor  = function(){
                if(this.dragging){
                    return shadeColor(this.color, 50);
                }else if(this.intersecting){
                    return shadeColor(this.color, -40);
                }else{
                    return this.color;
                }
            }
            this.pointInCircle = function(coords){
                return distance(coords, {x : this.cx, y : this.cy}) < this.r
            }

            this.beginDrag = function(coords){
                this.dragDifference = {
                    x : this.cx - coords.x,
                    y : this.cy - coords.y
                }
                this.dragging = true;
            }

            this.drag = function(coords){
                this.cx = coords.x + this.dragDifference.x;
                this.cy = coords.y + this.dragDifference.y;
            }

            this.endDrag = function(){
                this.dragging = false;
            }

            this.intersectingCircles = function(circles){
                let res = [];
                for(const circle of circles){
                    if(circle !== this && distance({x: this.cx, y : this.cy}, {x: circle.cx, y : circle.cy}) < this.r+circle.r){
                        res.push(circle);
                    }
                }
                return res;
            }

            this.isIntersected = function(circles){
                this.intersecting = true;
            }

            this.isNotIntersected = function(){
                this.intersecting = false;
            }

        }
        const getCoords = function(e){
            const rect = canvas.getBoundingClientRect();
            return {
                x : e.pageX - rect.x,
                y : e.pageY - rect.y
            }
        }



        var HoldersViz = function(canvas, context, holders){
            this.context = context;
            this.holders = holders;
            this.circles = [];
            this.canvas = canvas
            for(const i in this.holders){
                const holder = this.holders[i];

                this.circles.push(new Circle(100+100*i,
                    60,
                    30+holder.BABBalance/10,
                    holder.login ,
                    colors[Math.floor(Math.random()*colors.length)] ,
                    holder.BABBalance
                ));
            }
            this.draw = function(){
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                const drawCircle = function(circle){
                    context.beginPath();
                    context.fillStyle = circle.getColor();
                    context.arc(circle.cx, circle.cy, circle.r, 0, 2*Math.PI, false);
                    context.fill();
                    context.fillStyle = 'white';
                    context.textAlign = 'center';
                    context.font = "15px Arial";
                    context.fillText(circle.label, circle.cx, circle.cy-2);
                    context.font = "10px Arial";
                    context.fillText(circle.BABBalance, circle.cx, circle.cy+8);
                }
                let draggedCircle;
                for(const circle of this.circles){

                    if(!circle.dragging){
                        drawCircle(circle)
                    }else{
                        draggedCircle = circle;
                    }

                }
                if(draggedCircle)
                    drawCircle(draggedCircle)
            }

            this.mousedown =  function(coords){
                for(let circle of this.circles){
                    if(circle.pointInCircle(coords)){
                        this.canvas.style.cursor = "grab"
                        circle.beginDrag(coords);
                        break;
                    }
                }
                this.draw();
            }

            this.mouseup = function(coords){
                let virements = [];
                for(let i in this.circles){
                    const circle = this.circles[i];
                    if(circle.dragging){
                        const receivers = circle.intersectingCircles(this.circles);
                        if(receivers.length){
                            const sender = this.holders[i];

                            const receiver = this.holders[this.circles.indexOf(receivers[0])];
                            let value = prompt("Combien de mBAB "+sender.login+" va donner à "+receiver.login+"?");
                            if(value){
                                if(!isNaN(parseFloat(value))){
                                    value = parseFloat(value);
                                    sendBAB(sender.id_user, receiver.id_user, toBAB(value));
                                }else{
                                    alert("C'est pas un nombre ça petit filou!");
                                }
                            }
                        }
                        circle.endDrag(coords);
                    }
                }
                this.draw();
            }

            this.mousemove = function(coords){
                const intersectedCircles = [];
                for(let circle of this.circles){
                    circle.isNotIntersected();
                }
                let circleIsPointed = false;
                let dragging = false;
                for(let circle of this.circles){
                    if(circle.pointInCircle(coords)){
                        circleIsPointed = true;
                    }
                    if(circle.dragging){
                        dragging = true;
                        circle.drag(coords);
                        for(const intersected of circle.intersectingCircles(this.circles)){
                            intersected.isIntersected();
                            break;
                        }
                    }
                }
                if(dragging){
                    this.canvas.cursor = "grab"
                }else if (circleIsPointed){
                    this.canvas.style.cursor = "pointer"
                }else{
                    this.canvas.style.cursor = "inherit"
                }
                this.draw();
            }

        }

        const viz  = new HoldersViz(canvas, context, holders)
        canvas.addEventListener('mousedown', function(e){
            const coords = getCoords(e);
            viz.mousedown(coords)
        });
        canvas.addEventListener('mouseup', function(e){
            viz.mouseup(getCoords(e));
        })
        canvas.addEventListener('mousemove', function(e){
            viz.mousemove(getCoords(e));
        })
        viz.draw();
    });
  })
