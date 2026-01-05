package com.materialguardian.app.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.materialguardian.app.UploadQueueItem
import com.materialguardian.app.UploadStatus
import com.materialguardian.app.databinding.ItemUploadQueueBinding

class UploadQueueAdapter(
    private val onRetry: (UploadQueueItem) -> Unit
) : RecyclerView.Adapter<UploadQueueAdapter.UploadQueueViewHolder>() {

    private val items = mutableListOf<UploadQueueItem>()

    fun submitList(newItems: List<UploadQueueItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UploadQueueViewHolder {
        val binding = ItemUploadQueueBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return UploadQueueViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UploadQueueViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class UploadQueueViewHolder(
        private val binding: ItemUploadQueueBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: UploadQueueItem) {
            binding.uploadType.text = item.type
            binding.uploadStatus.text = item.status.name
            binding.uploadError.text = item.error.orEmpty()
            binding.uploadError.visibility = if (item.error != null) android.view.View.VISIBLE else android.view.View.GONE
            binding.uploadRetryButton.visibility = if (item.status == UploadStatus.FAILED) android.view.View.VISIBLE else android.view.View.GONE
            binding.uploadRetryButton.setOnClickListener { onRetry(item) }
        }
    }
}
