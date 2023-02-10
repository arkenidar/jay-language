// JSON format for programs

// 8 keywords: "$func","$skip","$val","$expr","$op","$attr","$attr_set","$call"

globalThis. $expr = function $expr(expr){
    let index;
    if(expr[0]!=="$expr"){
        console.error("mismatch in $expr :",expr[0])
        return null
    }
    let ip = 1;
    let context = globalThis;
    let current_value = null;
    let operation_id = null;
    while(ip < expr.length){
        let current = expr[ip];
        let do_operation = false;
        let new_value = false;
        let previous_value = current_value;

        if(current[0]==="$attr"){
            let attr = current;

            for(index = 1; index<attr.length; index += 1) {
                let attribute_id = attr[index];

                if (typeof context[attribute_id] == "undefined") {
                    console.error("undefined context[attribute_id] :", attribute_id)
                    return undefined
                }

                current_value = context[attribute_id]
                new_value = true

                context = current_value
            }
        } else if(current[0]==="$attr_set"){
            let attr_set = current;
            current_value = context[attr_set[1]]=get(attr_set[2])
            new_value = true
        } else if(current[0]==="$op"){
            operation_id = current[1]
        } else if(current[0]==="$val"){
            current_value = current[1]
            new_value = true
        } else if(current[0]==="$expr"){
            current_value = $expr(current)
            new_value = true
        } else if(current[0]==="$call"){
            let arguments = [];
            for(index = 1; index<current.length; index += 1){
                let argument = current[index];
                arguments.push(get(argument))
            }
            current_value = context(...arguments)
            new_value = true
        } else {
            console.error("unsupported in $expr :", current[0])
            return null
        }
        do_operation = new_value && operation_id!=null
        if(do_operation){
            if(operation_id==="+"){
                current_value = previous_value + current_value
            } else if(operation_id==="-"){
                current_value = previous_value - current_value
            } else if(operation_id==="*"){
                current_value = previous_value * current_value
            } else if(operation_id==="/"){
                current_value = previous_value / current_value
            } else if(operation_id==="**"){
                current_value = previous_value ** current_value
            } else {
                console.error("unsupported operation_id :", operation_id)
            }
            operation_id = null
        }

        context = current_value

        ip += 1
    }
    return current_value
}

globalThis. $attr_set= function $attr_set(attr_set){
    return globalThis[attr_set[1]]=get(attr_set[2])
}

globalThis. $val= function $val(val){
    return val[1]
}

globalThis. $attr= function $attr(attr){
    let context = globalThis;
    let result;
    for(let index = 1; index<attr.length; index += 1){
        let attribute_id = attr[index];

        if(typeof context[attribute_id]=="undefined"){
            console.error("undefined context[attribute_id] :", attribute_id)
            return undefined
        }
        result = context[attribute_id]

        context = result
    }
    return result
}

function get(json){
    if(typeof globalThis[json[0]] == "function"){
        return globalThis[json[0]](json)
    } else {
        console.error("no function found for get() :",json[0])
        return null
    }
}

get(["$expr", ["$attr","console","log"], ["$call", ["$val", 123]]])

get(["$attr_set", "var_name", ["$val", {"counter":1}]])
var_name.counter += 10
get(["$expr",["$attr","var_name"],["$attr_set","counter",["$expr",["$attr","var_name","counter"],["$op","+"],["$val",10]]]])
console.log(get(["$attr","var_name","counter"]))