const M = require('../models/members.model');
exports.getAll = async (_q,r)=>{ try{r.json(await M.getAll())}catch(e){r.status(500).json({message:e.message})}};
exports.getById = async (q,r)=>{ try{const x=await M.getById(q.params.id); if(!x) return r.status(404).json({message:'Not found'}); r.json(x)}catch(e){r.status(500).json({message:e.message})}};
exports.create = async (q,r)=>{ try{r.status(201).json(await M.create(q.body))}catch(e){r.status(400).json({message:e.message})}};
exports.update = async (q,r)=>{ try{const a=await M.update(q.params.id,q.body); if(!a) return r.status(404).json({message:'Not found'}); r.json(await M.getById(q.params.id))}catch(e){r.status(400).json({message:e.message})}};
exports.remove = async (q,r)=>{ try{const a=await M.delete(q.params.id); if(!a) return r.status(404).json({message:'Not found'}); r.json({message:'Deleted'})}catch(e){r.status(500).json({message:e.message})}};
