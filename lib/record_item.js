class RecordItem {
  constructor(){
    this.index = null;
  }

  // Virtual Functions
  get _attributes() {
    return {
    };
  }
  get _name(){
    return "";
  }
  get _base(){
    return "";
  }

  load(item){
    Object.keys(this._attributes).map(
      (key) => {
        //console.log(key);
        if(item[key])
          this[key] = item[key];
      }
    );
  }

  save(){
    if(this.index === null){
      return this._create();
    } else {
      return this._update();
    }
  }

  static find(base, index){
    if(base._loaded){
      return new this.constructor(base, base[this._name][index]);
    } else {
      return { };
    }
  }
  _clean(attr){
    let attributes = {};
    Object.keys(attr).map(
      (key) => {
        if(attr[key] != ""){
          attributes[key] = attr[key];
        }
      }
    );
    return attributes;
  }

  _create(){
    let attributes = this._clean(this._attributes);
    return this[this._base]._add_item(this.constructor._name,attributes)
      .then(
        (data) => {
          this.load(data);
          return this;
        }
      );
  }
  _update(){
    let attributes = this._clean(this._attributes);
    return this[this._base]._update_item(this.constructor._name,this.index, attributes)
      .then(
        (data) => {
          this.load(data);
          return this;
        }
      );
  }
  delete(){
    return this[this._base]._delete_item(this.constructor._name,this.index);
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


}
module.exports = RecordItem;
