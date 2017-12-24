const AWS  = require("aws-sdk");
const config = require("./config");
AWS.config.update(config.aws);
const docClient = new AWS.DynamoDB.DocumentClient();

class Record {
  constructor(){
    this.loaded = false;
    this.new = true;
  }

  // Virtual Functions
  get _keys(){
    return {};
  }
  static get TableName() {
    return "";
  }
  get _attributes(){
    return {};
  }
  get _lists(){
    return {};
  }

  // Functions
  static find(item){
    return item._get()
      .then(
        (result) => {
          if(result){
            return item;
          } else {
            return false;
          }
        }
      );
  }

  static all(item,key){
    return item._all(key);
  }

  _all(key){
    let params= {
      TableName: this.constructor.TableName,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames:{
        "#id": key
      },
      ExpressionAttributeValues: {
        ":id": this[key]
      }
    };
    return docClient.query(params).promise()
      .then(
        (data) => {
          return data.Items;
        }
      );

  }
  load(item){
    Object.keys(this._attributes).map(
      (key) => {
        if(item[key])
          this[key] = item[key];
      }
    );
  }

  get json() {
    let attributes = this._attributes;
    Object.keys(this._keys).map(
      (key) => {
        attributes[key] = this[key];
      }
    );
    Object.keys(this._lists).map(
      (key) => {
        attributes[key] = this[key];
      }
    );
    return attributes;
  }

  save(){
    if(this.new){
      return this._create();
    } else {
      return this._update();
    }
  }


  _get(){
    const params= {
      TableName: this.constructor.TableName,
      Key: this._keys,
    };
    return docClient.get(params).promise().then(
      (data) => {
        if(Object.keys(data).length > 0) {
          Object.keys(data.Item).map( (key) => {
            this[`${key}`] = data.Item[`${key}`];
          });
          this.loaded = true;
          this.new = false;
          return true;
        } else {
          return false;
        }

      },
      (err) => {
        console.error(err.message);
        return new Error("Item get error:",err);
      }
    );
  }


  _verify(){
    return !this._get();
  }

  _create(){
    let attributes = this._attributes;
    Object.keys(this._keys).map(
      (key) => {
        attributes[key] = this[key];
      }
    );
    Object.keys(this._lists).map(
      (key) => {
        attributes[key] = this[key];
      }
    );

    let params= {
      TableName: this.constructor.TableName,
      ConditionExpression: `attribute_not_exists(${this._sort})`,
      Item: attributes
    };
    //console.log(params);
    return docClient.put(params).promise()
      .then(
        () => {
          return this.json;
        }
      );
  }

  get _UpdateExpression(){
    let exp = "SET ";
    Object.keys(this._attributes).map(
      (key) => {
        exp += `${key}=:${key} , `;
      }
    );
    return exp.substring(0, exp.length-3);
  }

  _update(){
    let attributes = {};
    Object.keys(this._attributes).map(
      (key) => {
        attributes[`:${key}`] = this[key];
      }
    );
    const params = {
      TableName: this.constructor.TableName,
      Key: this._keys,
      UpdateExpression: this._UpdateExpression,
      ExpressionAttributeValues: attributes,
      ReturnValues: "ALL_NEW"
    };
    return docClient.update(params).promise()
      .then(
        (data) => {
          if(Object.keys(data).length > 0) {
            Object.keys(data.Attributes).map( (key) => {
              this[`${key}`] = data.Attributes[`${key}`];
            });
            this.loaded = true;
            this.new = false;
            return this;
          } else {
            return false;
          }
        }
      );
  }

  delete(){
    let params= {
      TableName: this.constructor.TableName,
      Key: this._keys
    };
    return docClient.delete(params).promise();
  }


  _add_item(name,item){
    const params = {
      TableName: this.constructor.TableName,
      Key: this._keys,
      UpdateExpression: "SET #list = list_append(#list,:a)",
      ExpressionAttributeNames:{
        "#list": name
      },
      ExpressionAttributeValues:{
        ":a": [ item ]
      },
      ReturnValues: "ALL_NEW"
    };
    //console.log(item);
    return docClient.update(params).promise()
      .then(
        (data) => {
          this[name] = data.Attributes[name];
          let size = data.Attributes[name].length;
          return this[name][size-1];
        },
        err => {
          console.error(err);
          return err;
        }
      );
  }

  _update_item(name,index,item){
    const params = {
      TableName: this.constructor.TableName,
      Key: this._keys,
      UpdateExpression: "SET #list["+index+"] = :a",
      ExpressionAttributeNames: {
        "#list": name
      },
      ExpressionAttributeValues: {
        ":a": item
      },
      ReturnValues: "ALL_NEW"
    };
    if(index >= 0){
      return docClient.update(params).promise()
        .then(
          (data) => {
            this[name] = data.Attributes[name];
            return this[name][index];
          },
          err => {
            console.error(err);
            return err;
          }
        );
    } else return "Nao existente";
  }

  _delete_item(name,index){
    const params = {
      TableName: this.constructor.TableName,
      Key: this._keys,
      UpdateExpression: `REMOVE ${name}[${index}]`,
      ReturnValues: "ALL_NEW"
    };
    if(index >= 0){
      return docClient.update(params).promise()
        .then(
          (data) => {
            this[name] = data.Attributes[name];
            return this[name];
          },
          err => {
            console.error(err);
            return err;
          }
        );
    } else return "Nao existente";
  }


}
module.exports = Record;

