package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.navArgs
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentJobDetailBinding
import kotlinx.coroutines.launch
import java.text.DateFormat

class JobDetailFragment : Fragment(R.layout.fragment_job_detail) {

    private val args: JobDetailFragmentArgs by navArgs()
    private val viewModel: JobDetailViewModel by viewModels()
    private var _binding: FragmentJobDetailBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentJobDetailBinding.bind(view)
        collectState()
        viewModel.load(args.jobNumber)
    }

    private fun collectState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    binding.jobDetailProgress.visibility = if (state.loading) View.VISIBLE else View.GONE
                    binding.jobDetailEmpty.visibility =
                        if (!state.loading && state.job == null) View.VISIBLE else View.GONE
                    state.job?.let { job ->
                        binding.jobNumber.text = getString(R.string.job_detail_number, job.jobNumber)
                        binding.jobDescription.text = getString(R.string.job_detail_description, job.description)
                        binding.jobNotes.text = getString(R.string.job_detail_notes, job.notes)
                        val formattedDate = DateFormat.getDateTimeInstance().format(job.createdAt.toDate())
                        binding.jobCreatedAt.text = getString(R.string.job_detail_created_at, formattedDate)
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
