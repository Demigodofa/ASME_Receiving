package com.materialguardian.app.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.materialguardian.app.MaterialItem
import com.materialguardian.app.databinding.ItemMaterialBinding

class MaterialsAdapter(
    private val onClick: (MaterialItem) -> Unit
) : RecyclerView.Adapter<MaterialsAdapter.MaterialViewHolder>() {

    private val items = mutableListOf<MaterialItem>()

    fun submitList(newItems: List<MaterialItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MaterialViewHolder {
        val binding = ItemMaterialBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return MaterialViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MaterialViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class MaterialViewHolder(
        private val binding: ItemMaterialBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: MaterialItem) {
            binding.materialName.text = item.description
            binding.materialStatus.text = binding.root.context.getString(
                com.materialguardian.app.R.string.material_offload_status,
                item.offloadStatus
            )
            binding.materialQuantity.text = binding.root.context.getString(
                com.materialguardian.app.R.string.material_quantity,
                item.quantity
            )
            binding.root.setOnClickListener { onClick(item) }
        }
    }
}
