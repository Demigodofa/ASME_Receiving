package com.materialguardian.app.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.materialguardian.app.JobItem
import com.materialguardian.app.databinding.ItemJobBinding

class JobsAdapter(
    private val onClick: (JobItem) -> Unit
) : RecyclerView.Adapter<JobsAdapter.JobViewHolder>() {

    private val items = mutableListOf<JobItem>()

    fun submitList(newItems: List<JobItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): JobViewHolder {
        val binding = ItemJobBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return JobViewHolder(binding)
    }

    override fun onBindViewHolder(holder: JobViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class JobViewHolder(
        private val binding: ItemJobBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: JobItem) {
            binding.jobNumber.text = item.jobNumber
            binding.jobDescription.text = item.description
            binding.root.setOnClickListener { onClick(item) }
        }
    }
}
