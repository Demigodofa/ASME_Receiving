package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentUploadQueueBinding
import kotlinx.coroutines.launch

class UploadQueueFragment : Fragment(R.layout.fragment_upload_queue) {

    private val viewModel: UploadQueueViewModel by viewModels()
    private var _binding: FragmentUploadQueueBinding? = null
    private val binding get() = _binding!!
    private val adapter = UploadQueueAdapter { item ->
        viewModel.retry(item.id)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentUploadQueueBinding.bind(view)
        binding.uploadQueueRecycler.layoutManager = LinearLayoutManager(requireContext())
        binding.uploadQueueRecycler.adapter = adapter
        collectState()
    }

    private fun collectState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    binding.uploadQueueProgress.visibility = if (state.loading) View.VISIBLE else View.GONE
                    binding.uploadQueueEmpty.visibility =
                        if (!state.loading && state.items.isEmpty()) View.VISIBLE else View.GONE
                    adapter.submitList(state.items)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
