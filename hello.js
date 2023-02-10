// JSON format for programs

// 8 keywords: "$func","$skip","$val","$expr","$op","$attr","$attr_set","$call"

globalThis. $expr = function $expr(expr, context){

    if(expr[0]!=="$expr"){
        console.error("mismatch in $expr :",expr[0])
        return null
    }

    let current_value = null;
    let operation_id = null;

    for(let ip = 1; ip < expr.length; ip++){
        let current = expr[ip];

        let do_operation = false;
        let new_value = false;
        let previous_value = current_value;

        if(current[0]==="$attr"){
            current_value = $attr(current, context)
            new_value = true

        } else if(current[0]==="$attr_set"){
            current_value = $attr_set(current, current_value, context)
            new_value = true

        } else if(current[0]==="$op"){
            operation_id = current[1]

        } else if(current[0]==="$val"){
            current_value = $val(current)
            new_value = true

        } else if(current[0]==="$expr"){
            current_value = $expr(current, context)
            new_value = true

        } else if(current[0]==="$call"){

            let arguments = [];
            for(let index = 1; index<current.length; index += 1){
                let argument = current[index];
                arguments.push(get(argument, context))
            }
            current_value = current_value(...arguments)
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

    }
    return current_value
}

globalThis. $val= function $val(val){
    return val[1]
}

globalThis. $attr= function $attr(attr, context){
    let current = context;
    for(let index = 1; index<attr.length; index += 1){
        let attribute_id = attr[index];

        if(typeof current[attribute_id]=="undefined"){
            console.error("undefined current[attribute_id] :", attribute_id)
            return undefined
        }
        current = current[attribute_id]
    }
    return current
}

globalThis. $attr_set= function $attr_set(attr_set, of_object, context){
    return of_object[attr_set[1]] = get(attr_set[2], context)
}

function get(json, context=globalThis){
    if(typeof context[json[0]] == "function"){
        return context[json[0]](json, context)
    } else {
        console.error("no function found for get() :",json[0])
        return null
    }
}

function tests1(){
    // outputs 123
    get(["$expr", ["$attr","console","log"], ["$call", ["$val", 123]]])

    // outputs 21
    get(["$attr_set", "var_name", ["$val", {"counter":1}]])
    var_name.counter += 10
    get(["$expr",["$attr","var_name"],["$attr_set","counter",["$expr",["$attr","var_name","counter"],["$op","+"],["$val",10]]]])
    console.log(get(["$attr","var_name","counter"]))
}

function tests2(){
    // outputs *local1*
    let local_context={...globalThis, "local_variable1":"*local1*"}
    console.log( get(["$attr","local_variable1"], local_context) )
}

tests1()
tests2()
